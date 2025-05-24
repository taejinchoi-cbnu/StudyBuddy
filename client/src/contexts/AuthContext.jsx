import { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail as firebaseUpdateEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import UseLoading from '../hooks/useLoading';

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

  // 회원가입 함수 - UseLoading 훅을 사용하지 않는 버전
  async function signup(email, password, displayName, isVerified = true, certifiedDate = null) {
    console.log("AuthContext - signup 함수 호출됨:", { email, displayName, isVerified });
    
    try {
      console.log("Firebase Auth - 계정 생성 시도");
      setLoading(true);
      
      // Firebase 인증 - UseLoading 훅을 사용하지 않고 직접 호출
      console.log("Firebase 인증 직접 호출");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user || !user.uid) {
        console.error("Firebase 인증은 성공했지만 유효한 사용자 객체를 받지 못했습니다.");
        throw new Error("사용자 계정 생성에 실패했습니다.");
      }
      
      console.log("Firebase Auth - 계정 생성 성공:", user.uid);
      
      // Firestore에 사용자 프로필 문서 생성
      console.log("Firestore - 사용자 프로필 생성 시도");
      try {
        await setDoc(doc(firestore, 'users', user.uid), {
          uid: user.uid,
          email: email,
          displayName: displayName,
          department: "",
          interests: [],
          groups: [],
          certified_email: true,  // 항상 true로 설정
          certified_date: certifiedDate || new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        console.log("Firestore - 사용자 프로필 생성 성공");
      } catch (firestoreError) {
        console.error("Firestore 프로필 생성 오류:", firestoreError);
        // Firestore 오류가 발생해도 인증은 성공했으므로 사용자 객체 반환
      }
      
      return user;
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);
      throw error; // 에러를 다시 throw
    } finally {
      setLoading(false);
      // isSigningUp 상태는 UseLoading 훅을 사용하지 않으므로 수동으로 업데이트
      // 이 부분은 필요하지 않을 수 있음
    }
  }

  // 로그인 함수
  async function login(email, password) {
    try {
      const result = await startLoginLoading(signInWithEmailAndPassword(auth, email, password));
      return result;
    } catch (error) {
      console.error("로그인 오류:", error);
      throw error;
    }
  }

  // 로그아웃 함수
  async function logout() {
    try {
      await startLogoutLoading(signOut(auth));
    } catch (error) {
      console.error("로그아웃 오류:", error);
      throw error;
    }
  }

  // 비밀번호 재설정 함수
  async function resetPassword(email) {
    try {
      await startResetPasswordLoading(sendPasswordResetEmail(auth, email));
    } catch (error) {
      console.error("비밀번호 재설정 오류:", error);
      throw error;
    }
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
          userData.certified_email = true; // 기본값을 true로 변경
        }
        if (userData.certified_date === undefined) {
          userData.certified_date = userData.createdAt || new Date().toISOString();
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
            certified_email: true, // 기본값을 true로 변경
            certified_date: new Date().toISOString(),
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

  // 이메일 업데이트 함수
  async function updateEmail(newEmail) {
    if (!currentUser) throw new Error('No authenticated user');
    
    try {
      console.log(`이메일 업데이트 시작: ${currentUser.email} -> ${newEmail}`);
      
      // Firebase Authentication 이메일 업데이트
      await firebaseUpdateEmail(auth.currentUser, newEmail);
      console.log('Firebase Auth 이메일 업데이트 성공');
      
      // 충북대 이메일인지 확인
      const isChungbukEmail = newEmail.endsWith('@chungbuk.ac.kr');
      
      // Firestore에 이메일 업데이트
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, { 
        email: newEmail,
        certified_email: isChungbukEmail, // 충북대 이메일이면 자동 인증
        certified_date: isChungbukEmail ? new Date().toISOString() : null
      }, { merge: true });
      console.log('Firestore 이메일 업데이트 성공');
      
      // 프로필 상태 업데이트
      setUserProfile(prev => ({
        ...prev,
        email: newEmail,
        certified_email: isChungbukEmail,
        certified_date: isChungbukEmail ? new Date().toISOString() : null
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
  
  // clearTempUserData 함수는 실제로 사용되지 않지만, 인터페이스 호환성을 위해 유지
  function clearTempUserData() {
    // 임시 데이터 저장이 필요 없으므로 빈 함수로 유지
    console.log("임시 사용자 데이터 관련 함수 호출됨 - 이 함수는 더 이상 사용되지 않습니다.");
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

  // context value
  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    updateUserProfile,
    updateEmail,
    clearTempUserData, // 호환성을 위해 유지
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