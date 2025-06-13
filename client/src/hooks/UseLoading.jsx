import { useState, useRef, useEffect, useCallback } from 'react';

//로딩 상태 관리하는 훅 원래 더 간단하게 하려했는데
const useLoading = () => {
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const currentlyLoading = useRef(false); //중복 방지용

  //컴포넌트 마운트됐는지 추적
  //언마운트될때 정리해야함
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      currentlyLoading.current = false;
    };
  }, []);

  //로딩 시작하는 함수
  const executeWithLoading = useCallback(async (asyncTask) => {
    //마운트 안되어있으면 그냥 리턴
    if (!isMountedRef.current) {
      return;
    }
    
    //이미 로딩중이면 일단 스킵
    if (currentlyLoading.current) {
      console.warn('이미 로딩중임');
      return;
    }
    
    //로딩 시작
    currentlyLoading.current = true;
    setLoading(true);
    
    try {
      let result;
      if (typeof asyncTask === 'function') {
        result = await asyncTask();
      } else {
        result = await asyncTask; //promise일수도
      }
      
      //성공했을때 정리
      if (isMountedRef.current) {
        setLoading(false);
        currentlyLoading.current = false;
      }
      
      return result;
    } catch (err) {
      //에러 발생시 정리
      if (isMountedRef.current) {
        setLoading(false);
        currentlyLoading.current = false;
      }
      
      //에러는 그대로 던지기
      throw err;
    }
  }, []);

  //간단한 로딩 토글 함수도 만들어놓기
  const toggleLoading = useCallback(() => {
    if (isMountedRef.current) {
      setLoading(prev => !prev);
    }
  }, []);
  
  //수동으로 로딩 설정
  const setLoadingManually = useCallback((value) => {
    if (isMountedRef.current) {
      setLoading(value);
      currentlyLoading.current = value;
    }
  }, []);
  
  return {
    isLoading: loading,
    loading: loading, //둘다 제공 편의상
    startLoading: executeWithLoading,
    executeWithLoading,
    toggleLoading,
    setLoading: setLoadingManually
  };
};

export default useLoading;
