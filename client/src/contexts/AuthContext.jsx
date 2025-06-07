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
import useUIState from '../hooks/useUIState';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // useUIState를 사용하여 로딩 상태 관리
  const ui = useUIState({
    isSigningUp: false,
    isLoggingIn: false,
    isLoggingOut: false,
    isResettingPassword: false,
    isUpdatingProfile: false
  });

  // 회원가입 함수
  async function signup(email, password, displayName, isVerified = true, certifiedDate = null) {
    
    try {
      setLoading(true);
      
      // Firebase 인증
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user || !user.uid) {
        throw new Error("사용자 계정 생성에 실패했습니다.");
      }
      
      
      // Firestore에 사용자 프로필 문서 생성
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
      } catch (firestoreError) {
        console.error("Firestore 프로필 생성 오류:", firestoreError);
        // Firestore 오류가 발생해도 인증은 성공했으므로 사용자 객체 반환
      }
      
      return user;
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // 로그인 함수
  async function login(email, password) {
    try {
      return await ui.startLoading("isLoggingIn", async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });
    } catch (error) {
      console.error("로그인 오류:", error);
      throw error;
    }
  }

  // 로그아웃 함수
  async function logout() {
    try {
      await ui.startLoading("isLoggingOut", async () => {
        await signOut(auth);
      });
    } catch (error) {
      console.error("로그아웃 오류:", error);
      throw error;
    }
  }

  // 비밀번호 재설정 함수
  async function resetPassword(email) {
    try {
      await ui.startLoading("isResettingPassword", async () => {
        await sendPasswordResetEmail(auth, email);
      });
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
      
      // Firebase Authentication 이메일 업데이트
      await firebaseUpdateEmail(auth.currentUser, newEmail);
      
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
    return ui.startLoading("isUpdatingProfile", async () => {
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

  // context value
  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    updateUserProfile,
    updateEmail,
    authLoading: {
      signup: ui.isSigningUp,
      login: ui.isLoggingIn,
      logout: ui.isLoggingOut,
      resetPassword: ui.isResettingPassword,
      updateProfile: ui.isUpdatingProfile
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;