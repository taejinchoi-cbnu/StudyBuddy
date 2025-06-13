import { createContext, useContext, useState, useEffect } from 'react';

// 다크모드 상태 관리를 위한 컨텍스트 생성
const DarkModeContext = createContext();

// 다크모드 컨텍스트 제공자 컴포넌트
export function DarkModeProvider({ children }) {
  // 로컬 스토리지에서 이전 다크모드 상태를 로드 (에러 처리 추가)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('darkMode');
      return savedMode ? JSON.parse(savedMode) : false;
    } catch (error) {
      return false; // 오류 발생 시 기본값 사용
    }
  });

  // 다크모드 토글 함수
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  // 다크모드 상태가 변경될 때마다 로컬 스토리지에 저장하고 body 클래스 업데이트
  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    } catch (error) {
    }

    // 테마 전환 애니메이션을 위한 클래스 추가
    document.body.classList.add('theme-transition');

    // body에 dark-mode 클래스 추가 또는 제거
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // 애니메이션이 끝난 후 transition 클래스 제거
    const transitionEndHandler = () => {
      document.body.classList.remove('theme-transition');
    };

    const timer = setTimeout(transitionEndHandler, 1000); // 전환 시간보다 조금 더 길게 설정

    return () => {
      clearTimeout(timer);
      // 컴포넌트 언마운트 시 transition 클래스 제거
      document.body.classList.remove('theme-transition');
    };
  }, [darkMode]);

  // 프로바이더 값 설정
  const value = {
    darkMode,
    toggleDarkMode,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}

// 다크모드 컨텍스트 사용을 위한 커스텀 훅
export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode는 DarkModeProvider와 사용되어야 합니다.');
  }
  return context;
}

export default DarkModeProvider;
