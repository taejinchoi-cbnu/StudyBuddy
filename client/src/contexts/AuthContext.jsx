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
import ServerApi from '../utils/ServerApi';

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
      
      // 1. Firebase 인증
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user || !user.uid) {
        throw new Error("사용자 계정 생성에 실패했습니다.");
      }
      
      // 2. 서버 등록 (선택적)
      try {
        const token = await user.getIdToken();
        console.log('[회원가입] 서버 등록 시도 중...');
        
        const serverResponse = await ServerApi.registerUser(token, {
          email: email,
          displayName: displayName,
          verified: false, // 항상 false로 설정
          certified_date: null // 항상 null로 설정
        });
        console.log('[회원가입] 서버 등록 성공:', serverResponse);
      } catch (serverError) {
        console.error('[회원가입] 서버 등록 실패 (무시됨):', serverError);
        console.log('[회원가입] Firebase 가입은 성공했으므로 계속 진행합니다.');
        // 서버 등록 실패해도 Firebase 가입은 성공했으므로 계속 진행
        // 사용자는 나중에 로그인할 때 서버에 등록될 수 있음
      }
      
      // 3. Firestore에 사용자 프로필 문서 생성 (백업용)
      try {
        await setDoc(doc(firestore, 'users', user.uid), {
          uid: user.uid,
          email: email,
          displayName: displayName,
          department: "",
          interests: [],
          groups: [],
          certified_email: false, // 항상 false로 설정
          certified_date: null, // 항상 null로 설정
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
        // 1. Firebase 인증
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 2. 서버 인증
        try {
          const token = await userCredential.user.getIdToken();
          const serverResponse = await ServerApi.loginUser(token);
          console.log('[로그인] 서버 인증 성공:', serverResponse);
        } catch (serverError) {
          console.error('[로그인] 서버 인증 실패:', serverError);
          
          // 만약 404 에러 (사용자 없음)라면 서버에 등록 시도
          if (serverError.message && serverError.message.includes('등록되지 않은 사용자')) {
            try {
              console.log('[로그인] 서버에 사용자 등록 시도...');
              const token = await userCredential.user.getIdToken();
              await ServerApi.registerUser(token, {
                email: userCredential.user.email,
                displayName: userCredential.user.displayName || ''
              });
              console.log('[로그인] 서버 등록 성공');
            } catch (registerError) {
              console.error('[로그인] 서버 등록 실패:', registerError);
            }
          }
          // 서버 인증 실패해도 Firebase 인증이 성공했으면 계속 진행
        }
        
        return userCredential;
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
        // 1. 서버 로그아웃 (토큰 무효화)
        try {
          if (currentUser) {
            const token = await currentUser.getIdToken();
            await ServerApi.logoutUser(token);
            console.log('[로그아웃] 서버 로그아웃 성공');
          }
        } catch (serverError) {
          console.error('[로그아웃] 서버 로그아웃 실패:', serverError);
          // 서버 로그아웃 실패해도 Firebase 로그아웃은 계속 진행
        }
        
        // 2. Firebase 로그아웃
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
        
        // 이메일 인증 필드가 없으면 기본값 추가 (false로 설정)
        if (userData.certified_email === undefined) {
          userData.certified_email = false; // 기본값을 false로 변경
        }
        if (userData.certified_date === undefined) {
          userData.certified_date = null; // 기본값을 null로 변경
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
            certified_email: false, // 기본값을 false로 변경
            certified_date: null, // 기본값을 null로 변경
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
      
      // 서버에서 이메일 인증 상태 확인 및 업데이트
      let certificationData = { certified_email: false, certified_date: null };
      try {
        const token = await currentUser.getIdToken();
        const certResponse = await ServerApi.updateEmailCertification(token);
        if (certResponse.success) {
          certificationData = {
            certified_email: certResponse.certified_email,
            certified_date: certResponse.certified_date
          };
        }
      } catch (serverError) {
        console.error('서버 인증 상태 업데이트 실패:', serverError);
        // 충북대 이메일인지만 확인 (기본 로직)
        const isChungbukEmail = newEmail.endsWith('@chungbuk.ac.kr');
        certificationData = {
          certified_email: isChungbukEmail,
          certified_date: isChungbukEmail ? new Date().toISOString() : null
        };
      }
      
      // Firestore에 이메일 업데이트
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, { 
        email: newEmail,
        certified_email: certificationData.certified_email,
        certified_date: certificationData.certified_date
      }, { merge: true });
      console.log('Firestore 이메일 업데이트 성공');
      
      // 프로필 상태 업데이트
      setUserProfile(prev => ({
        ...prev,
        email: newEmail,
        certified_email: certificationData.certified_email,
        certified_date: certificationData.certified_date
      }));
      
      return true;
    } catch (error) {
      console.error('이메일 업데이트 오류:', error);
      throw error;
    }
  }

  // 이메일 인증 상태 업데이트 함수
  async function updateEmailCertification() {
    if (!currentUser) throw new Error('No authenticated user');
    
    try {
      const token = await currentUser.getIdToken();
      const response = await ServerApi.updateEmailCertification(token);
      
      if (response.success) {
        // 프로필 상태 업데이트
        setUserProfile(prev => ({
          ...prev,
          certified_email: response.certified_email,
          certified_date: response.certified_date
        }));
        
        // Firestore도 업데이트
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          certified_email: response.certified_email,
          certified_date: response.certified_date
        }, { merge: true });
        
        return response;
      }
      
      throw new Error(response.message || '인증 상태 업데이트 실패');
    } catch (error) {
      console.error('이메일 인증 상태 업데이트 오류:', error);
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
    updateEmailCertification,
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