import { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail as firebaseUpdateEmail // 이름 명확히 변경
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import UseLoading from '../hooks/UseLoading';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UseLoading 커스텀 훅을 각 인증 작업별로 적용
  const [isSigningUp, startSignupLoading] = UseLoading();
  const [isLoggingIn, startLoginLoading] = UseLoading();
  const [isLoggingOut, startLogoutLoading] = UseLoading();
  const [isResettingPassword, startResetPasswordLoading] = UseLoading();
  const [isUpdatingProfile, startUpdateProfileLoading] = UseLoading();

  // 회원가입 함수
  async function signup(email, password, displayName) {
    console.log("AuthContext - signup 함수 호출됨:", { email, displayName });
    
    try {
      console.log("Firebase Auth - 계정 생성 시도");
      setLoading(true);
      
      // 사용자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase Auth - 계정 생성 성공:", user.uid);
      
      // Firestore에 사용자 프로필 문서 생성
      console.log("Firestore - 사용자 프로필 생성 시도");
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: email,
        displayName: displayName,
        department: "",
        interests: [],
        groups: [],
        certified_email: false,  // 이메일 인증 상태 필드 추가
        certified_date: null,    // 인증 날짜 필드 추가
        createdAt: serverTimestamp()
      });
      console.log("Firestore - 사용자 프로필 생성 성공");
      
      return user;
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);
      throw error; // 에러를 다시 throw
    } finally {
      setLoading(false);
    }
  }

  // 로그인 함수
  function login(email, password) {
    return startLoginLoading(signInWithEmailAndPassword(auth, email, password));
  }

  // 로그아웃 함수
  function logout() {
    return startLogoutLoading(signOut(auth));
  }

  // 비밀번호 재설정 함수
  function resetPassword(email) {
    return startResetPasswordLoading(sendPasswordResetEmail(auth, email));
  }

  // 사용자 프로필 데이터 가져오기
  async function fetchUserProfile(uid) {
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 이메일 인증 필드가 없으면 기본값 추가
        if (userData.certified_email === undefined) {
          userData.certified_email = false;
        }
        if (userData.certified_date === undefined) {
          userData.certified_date = null;
        }
        
        setUserProfile(userData);
        return userData;
      } else {
        console.error('사용자 파일이 존재하지 않습니다.');
        
        // 사용자 프로필을 생성하는 코드 추가
        try {
          const basicProfile = {
            uid: uid,
            email: auth.currentUser?.email || '',
            displayName: auth.currentUser?.displayName || '',
            department: "",
            interests: [],
            groups: [],
            certified_email: false,
            certified_date: null,
            createdAt: serverTimestamp()
          };
          
          await setDoc(userDocRef, basicProfile);
          setUserProfile(basicProfile);
          return basicProfile;
        } catch (createError) {
          console.error('사용자 프로필 생성 실패:', createError);
          return null;
        }
      }
    } catch (error) {
      console.error('유저 프로필을 가져오는데 문제가 발생했습니다:', error);
      return null;
    }
  }

  // 이메일 업데이트 함수 - 함수명은 유지하되 내부에서 Firebase 함수는 다른 이름으로 사용
  async function updateEmail(newEmail) {
    if (!currentUser) throw new Error('No authenticated user');
    
    try {
      console.log(`이메일 업데이트 시작: ${currentUser.email} -> ${newEmail}`);
      
      // Firebase Authentication 이메일 업데이트 - firebaseUpdateEmail 사용
      await firebaseUpdateEmail(auth.currentUser, newEmail);
      console.log('Firebase Auth 이메일 업데이트 성공');
      
      // Firestore에 이메일 업데이트
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, { 
        email: newEmail,
        certified_email: false, // 이메일 변경 시 인증 상태 초기화
        certified_date: null 
      }, { merge: true });
      console.log('Firestore 이메일 업데이트 성공');
      
      // 프로필 상태 업데이트
      setUserProfile(prev => ({
        ...prev,
        email: newEmail,
        certified_email: false,
        certified_date: null
      }));
      
      return true;
    } catch (error) {
      console.error('이메일 업데이트 오류:', error);
      throw error;
    }
  }

  // 사용자 프로필 업데이트
  async function updateUserProfile(profileData) {
    return startUpdateProfileLoading(async () => {
      if (!currentUser) throw new Error('No authenticated user');
      
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      
      // 이메일 인증 필드가 있는지 확인하고 타임스탬프 처리
      const updatedData = { ...profileData };
      
      // certified_date가 문자열인 경우 Date 객체로 변환
      if (updatedData.certified_date && typeof updatedData.certified_date === 'string') {
        try {
          updatedData.certified_date = new Date(updatedData.certified_date);
        } catch (error) {
          console.error('Invalid date format:', error);
          // 유효하지 않은 날짜인 경우 현재 날짜 사용
          updatedData.certified_date = new Date();
        }
      }
      
      console.log("Firestore에 업데이트할 최종 데이터:", updatedData);
      
      await setDoc(userDocRef, updatedData, { merge: true });
      
      // 프로필 상태 업데이트
      setUserProfile(prev => {
        const newProfile = { ...prev, ...updatedData };
        console.log("업데이트된 프로필:", newProfile);
        return newProfile;
      });
      
      return true;
    });
  }

  // 인증 상태 변경 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // context value에 로딩 상태들 추가
  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    updateUserProfile,
    updateEmail, // 함수명은 그대로 유지
    loading,
    // 각 작업별 로딩 상태 추가
    authLoading: {
      signup: isSigningUp,
      login: isLoggingIn,
      logout: isLoggingOut,
      resetPassword: isResettingPassword,
      updateProfile: isUpdatingProfile
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;