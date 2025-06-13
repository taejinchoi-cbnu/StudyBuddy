import { createContext, useContext, useState, useEffect } from 'react';
import { auth, firestore } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail as firebaseUpdateEmail, //이름 충돌 방지
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import useUIState from '../hooks/useUIState';
import ServerApi from '../utils/ServerApi';

//인증 컨텍스트 생성
const AuthContext = createContext();

//컨텍스트 사용하는 훅
export function useAuth() {
  return useContext(AuthContext);
}

//메인 프로바이더 컴포넌트
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  //UI 상태 관리 로딩 상태들
  const ui = useUIState({
    isSigningUp: false,
    isLoggingIn: false,
    isLoggingOut: false,
    isResettingPassword: false,
    isUpdatingProfile: false,
  });

  //회원가입 기능
  async function signup(
    email,
    password,
    displayName,
    _isVerified = true,
    _certifiedDate = null,
  ) {
    try {
      setLoading(true);

      //먼저 Firebase에 계정 만들기
      const newUserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const newUser = newUserCredential.user;

      if (!newUser || !newUser.uid) {
        throw new Error('사용자 계정 생성에 실패했습니다.');
      }

      //서버에도 등록 시도 실패해도 계속
      try {
        const userToken = await newUser.getIdToken();

        const serverResult = await ServerApi.registerUser(userToken, {
          email: email,
          displayName: displayName,
          verified: false, //기본은 false
          certified_date: null, //인증 날짜도 null
        });
      } catch (serverErr) {
        //서버 등록 실패해도 Firebase는 성공
        //나중에 로그인할때 다시 시도할 예정
      }

      //Firestore에도 프로필 저장
      try {
        const profileData = {
          uid: newUser.uid,
          email: email,
          displayName: displayName,
          department: '',
          interests: [],
          groups: [],
          certified_email: false, //기본은 미인증
          certified_date: null, //인증날짜 없음
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(firestore, 'users', newUser.uid), profileData);
      } catch (firestoreErr) {
        //Firestore 오류 있어도 계속 진행
      }

      return newUser;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }

  //로그인 기능
  async function login(email, password) {
    try {
      return await ui.startLoading('isLoggingIn', async () => {
        //Firebase 로그인 먼저
        const loginResult = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );

        //서버에도 알리기
        try {
          const userToken = await loginResult.user.getIdToken();
          const serverResult = await ServerApi.loginUser(userToken);
        } catch (serverErr) {

          //서버에 사용자 없으면 등록 시도
          if (
            serverErr.message &&
            serverErr.message.includes('등록되지 않은 사용자')
          ) {
            try {
              const token = await loginResult.user.getIdToken();
              await ServerApi.registerUser(token, {
                email: loginResult.user.email,
                displayName: loginResult.user.displayName || '',
              });
            } catch (registerErr) {
              //등록도 실패해도 로그인은 성공
            }
          }
          //서버 인증 실패해도 Firebase 인증 성공하면 OK
        }

        return loginResult;
      });
    } catch (e) {
      throw e;
    }
  }

  //로그아웃 기능
  async function logout() {
    try {
      await ui.startLoading('isLoggingOut', async () => {
        //서버에 로그아웃 알리기
        try {
          if (currentUser) {
            const userToken = await currentUser.getIdToken();
            await ServerApi.logoutUser(userToken);
          }
        } catch (serverErr) {
          //서버 로그아웃 실패해도 Firebase에서는 로그아웃
        }

        //Firebase 로그아웃
        await signOut(auth);
      });
    } catch (e) {
      throw e;
    }
  }

  //비밀번호 리셋
  async function resetPassword(email) {
    try {
      await ui.startLoading('isResettingPassword', async () => {
        await sendPasswordResetEmail(auth, email);
      });
    } catch (e) {
      throw e;
    }
  }

  //사용자 프로필 가져오기
  async function fetchUserProfile(uid) {
    try {
      const userRef = doc(firestore, 'users', uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const profileData = userSnapshot.data();

        //인증 필드 없으면 기본값
        if (profileData.certified_email === undefined) {
          profileData.certified_email = false;
        }
        if (profileData.certified_date === undefined) {
          profileData.certified_date = null;
        }

        setUserProfile(profileData);
        return profileData;
      } else {

        //프로필 없으면 기본 프로필 생성
        try {
          const defaultProfile = {
            uid: uid,
            email: auth.currentUser?.email || '',
            displayName: auth.currentUser?.displayName || '',
            department: '',
            interests: [],
            groups: [],
            certified_email: false, //기본은 미인증
            certified_date: null, //날짜도 null
            createdAt: serverTimestamp(),
          };

          await setDoc(userRef, defaultProfile);
          setUserProfile(defaultProfile);
          return defaultProfile;
        } catch (createErr) {
          return null;
        }
      }
    } catch (e) {
      return null;
    }
  }

  //이메일 변경 기능
  async function updateEmail(newEmail) {
    if (!currentUser) throw new Error('No authenticated user');

    try {
      //Firebase 이메일 변경
      await firebaseUpdateEmail(auth.currentUser, newEmail);

      //서버에서 인증 상태 확인
      let certData = { certified_email: false, certified_date: null };
      try {
        const userToken = await currentUser.getIdToken();
        const certResult = await ServerApi.updateEmailCertification(userToken);
        if (certResult.success) {
          certData = {
            certified_email: certResult.certified_email,
            certified_date: certResult.certified_date,
          };
        }
      } catch (serverErr) {
        //서버 실패시 충북대 이메일인지만 체크
        const isChungbuk = newEmail.endsWith('@chungbuk.ac.kr');
        certData = {
          certified_email: isChungbuk,
          certified_date: isChungbuk ? new Date().toISOString() : null,
        };
      }

      //Firestore에도 이메일 업데이트
      const userRef = doc(firestore, 'users', currentUser.uid);
      await setDoc(
        userRef,
        {
          email: newEmail,
          certified_email: certData.certified_email,
          certified_date: certData.certified_date,
        },
        { merge: true },
      );

      //프로필 상태도 업데이트
      setUserProfile((prev) => ({
        ...prev,
        email: newEmail,
        certified_email: certData.certified_email,
        certified_date: certData.certified_date,
      }));

      return true;
    } catch (e) {
      throw e;
    }
  }

  //이메일 인증 상태 업데이트
  async function updateEmailCertification() {
    if (!currentUser) throw new Error('No authenticated user');

    try {
      const userToken = await currentUser.getIdToken();
      const result = await ServerApi.updateEmailCertification(userToken);

      if (result.success) {
        //프로필 상태 변경
        setUserProfile((prev) => ({
          ...prev,
          certified_email: result.certified_email,
          certified_date: result.certified_date,
        }));

        //Firestore도 업데이트
        const userRef = doc(firestore, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            certified_email: result.certified_email,
            certified_date: result.certified_date,
          },
          { merge: true },
        );

        return result;
      }

      throw new Error(result.message || '인증 상태 업데이트 실패');
    } catch (e) {
      throw e;
    }
  }

  //프로필 업데이트
  async function updateUserProfile(profileData) {
    return ui.startLoading('isUpdatingProfile', async () => {
      if (!currentUser) throw new Error('No authenticated user');

      const userRef = doc(firestore, 'users', currentUser.uid);

      //데이터 처리
      const dataToUpdate = { ...profileData };

      //날짜 문자열이면 Date 객체로
      if (
        dataToUpdate.certified_date &&
        typeof dataToUpdate.certified_date === 'string'
      ) {
        try {
          dataToUpdate.certified_date = new Date(dataToUpdate.certified_date);
        } catch (dateErr) {
          //잘못된 날짜면 현재 날짜
          dataToUpdate.certified_date = new Date();
        }
      }

      await setDoc(userRef, dataToUpdate, { merge: true });

      //프로필 상태 동기화
      setUserProfile((prev) => {
        const updatedProfile = { ...prev, ...dataToUpdate };
        return updatedProfile;
      });

      return true;
    });
  }

  //인증 상태 변경 감지
  useEffect(() => {
    const authListener = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return authListener;
  }, []);

  //컨텍스트에 전달할 값들
  const contextValue = {
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
      updateProfile: ui.isUpdatingProfile,
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
