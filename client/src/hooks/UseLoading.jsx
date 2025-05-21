import { useState, useRef, useEffect, useCallback } from "react";

const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(true);
  
  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      console.log("🔍 컴포넌트가 언마운트됨, 로딩 상태 정리");
    };
  }, []);
  
  // 비동기 작업 관리 함수 - useCallback으로 메모이제이션
  const startLoading = useCallback(async (promise) => {
    if (!mounted.current) {
      console.log("🔍 컴포넌트가 언마운트됨, 로딩 중단");
      return Promise.reject(new Error("Component unmounted"));
    }
    
    // 이미 로딩 중인 경우 중복 요청 방지
    if (isLoading) {
      console.log("🔍 이미 로딩 중, 중복 요청 무시");
      return Promise.reject(new Error("Loading already in progress"));
    }
    
    console.log("🔍 로딩 시작");
    setIsLoading(true);
    
    try {
      console.log("🔍 Promise 실행 중");
      const result = await promise;
      console.log("🔍 Promise 완료, 결과:", result ? "데이터 있음" : "데이터 없음");
      
      // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
      if (mounted.current) {
        setIsLoading(false);
      }
      
      return result;
    } catch (error) {
      console.error("🔍 UseLoading 오류:", error);
      
      // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
      if (mounted.current) {
        setIsLoading(false);
      }
      
      throw error; // 에러를 다시 throw하여 상위로 전파
    }
  }, [isLoading]); // isLoading에 의존성 추가
  
  return [isLoading, startLoading];
};

export default useLoading;