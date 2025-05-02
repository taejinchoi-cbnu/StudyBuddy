import { createContext, useContext, useState, useEffect } from 'react';

// 다크모드 상태 관리를 위한 컨텍스트 생성
const DarkModeContext = createContext();

// 다크모드 컨텍스트 제공자 컴포넌트
export function DarkModeProvider({ children }) {
  // 로컬 스토리지에서 이전 다크모드 상태를 로드
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // 다크모드 토글 함수
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // 다크모드 상태가 변경될 때마다 로컬 스토리지에 저장하고 body 클래스 업데이트
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // body에 dark-mode 클래스 추가 또는 제거
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // 프로바이더 값 설정
  const value = {
    darkMode,
    toggleDarkMode
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
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}

export default DarkModeProvider;