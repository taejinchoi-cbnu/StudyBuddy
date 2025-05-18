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
    if (!mounted.current) {
      console.log('🔍 컴포넌트가 언마운트됨, 로딩 중단');
      return;
    }
    
    console.log('🔍 로딩 시작');
    setIsLoading(true);
    try {
      console.log('🔍 Promise 실행 중');
      const result = await promise;
      console.log('🔍 Promise 완료, 결과:', result ? '데이터 있음' : '데이터 없음');
      return result;
    } catch (error) {
      console.error('🔍 UseLoading 오류:', error);
      throw error; // 에러를 다시 throw하여 상위로 전파
    } finally {
      if (mounted.current) {
        console.log('🔍 로딩 상태 해제');
        setIsLoading(false);
      } else {
        console.log('🔍 컴포넌트 언마운트됨, 상태 업데이트 안함');
      }
    }
  };
  
  return [isLoading, startLoading];
};

export default UseLoading;