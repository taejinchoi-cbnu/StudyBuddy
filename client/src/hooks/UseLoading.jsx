import { useState, useRef, useEffect } from 'react';

const UseLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(true);
  
  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);
  
  // 비동기 작업 관리 함수
  const startLoading = async (promise) => {
    if (!mounted.current) return;
    
    setIsLoading(true);
    try {
      const result = await promise;
      return result;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };
  
  return [isLoading, startLoading];
};

export default UseLoading;