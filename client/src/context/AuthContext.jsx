import { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 회원가입 함수
  async function signup(email, password, displayName) {
    try {
      // 사용자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Firestore에 사용자 프로필 문서 생성
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        email: email,
        displayName: displayName,
        department: "",
        interests: [],
        profileImageUrl: "",
        groups: [],
        createdAt: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      throw error;
    }
  }

  // 로그인 함수
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // 로그아웃 함수
  function logout() {
    return signOut(auth);
  }

  // 비밀번호 재설정 함수
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // 사용자 프로필 데이터 가져오기
  async function fetchUserProfile(uid) {
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile(userData);
        return userData;
      } else {
        console.error('User document does not exist');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // 사용자 프로필 업데이트
  async function updateUserProfile(profileData) {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(userDocRef, profileData, { merge: true });
      
      // 프로필 상태 업데이트
      setUserProfile(prev => ({
        ...prev,
        ...profileData
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
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

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;