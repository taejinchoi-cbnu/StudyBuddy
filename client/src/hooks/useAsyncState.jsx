import { useState, useEffect, useCallback, useRef } from "react";

/**
 * 통합 비동기 상태 관리 훅
 * Firebase 데이터 페칭, 로딩, 에러, 알림을 모두 처리
 * 
 * @param {Function} asyncFunction - 실행할 비동기 함수
 * @param {Array} dependencies - useEffect 의존성 배열
 * @param {Object} options - 추가 옵션들
 * @returns {Object} 상태와 제어 함수들
 */
const useAsyncState = (asyncFunction, dependencies = [], options = {}) => {
  const {
    enabled = true,
    initialData = null,
    onSuccess,
    onError,
    transform,
    autoRefresh = false,
    refreshInterval = 30000, // 30초
    retryCount = 3,
    retryDelay = 1000,
    showNotifications = true,
    cacheDuration = 5 * 60 * 1000, // 5분
  } = options;

  // 상태 관리
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");
  const [lastFetch, setLastFetch] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // 컴포넌트 마운트 상태 추적
  const mounted = useRef(true);
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // 컴포넌트 언마운트 처리
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // 진행 중인 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 알림 메시지 관리 함수들
  const showError = useCallback((message) => {
    if (!mounted.current || !showNotifications) return;
    setSuccess("");
    setInfo("");
    setError(message);
  }, [showNotifications]);

  const showSuccess = useCallback((message) => {
    if (!mounted.current || !showNotifications) return;
    setError("");
    setInfo("");
    setSuccess(message);
    // 3초 후 자동 삭제
    setTimeout(() => {
      if (mounted.current) setSuccess("");
    }, 3000);
  }, [showNotifications]);

  const showInfo = useCallback((message) => {
    if (!mounted.current || !showNotifications) return;
    setError("");
    setSuccess("");
    setInfo(message);
    // 5초 후 자동 삭제
    setTimeout(() => {
      if (mounted.current) setInfo("");
    }, 5000);
  }, [showNotifications]);

  const clearNotifications = useCallback(() => {
    if (!mounted.current) return;
    setError("");
    setSuccess("");
    setInfo("");
  }, []);

  // 캐시 키 생성
  const getCacheKey = useCallback(() => {
    return JSON.stringify({
      fn: asyncFunction?.toString(),
      deps: dependencies
    });
  }, [asyncFunction, dependencies]);

  // 캐시된 데이터 확인
  const getCachedData = useCallback(() => {
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }
    return null;
  }, [getCacheKey, cacheDuration]);

  // 데이터 캐싱
  const setCachedData = useCallback((data) => {
    const cacheKey = getCacheKey();
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }, [getCacheKey]);

  // 재시도 로직
  const executeWithRetry = useCallback(async (fn, attempt = 0) => {
    try {
      return await fn();
    } catch (error) {
      if (attempt < retryCount) {
        console.log(`재시도 ${attempt + 1}/${retryCount} 실행 중...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        return executeWithRetry(fn, attempt + 1);
      }
      throw error;
    }
  }, [retryCount, retryDelay]);

  // 실제 데이터 페칭 함수
  const fetchData = useCallback(async (options = {}) => {
    if (!asyncFunction || !mounted.current) return;

    const { useCache = true, showLoading = true } = options;

    try {
      // 캐시된 데이터 확인
      if (useCache) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData);
          setLastFetch(Date.now());
          return cachedData;
        }
      }

      if (showLoading) {
        setLoading(true);
      }
      clearNotifications();

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새 AbortController 생성
      abortControllerRef.current = new AbortController();

      console.log("비동기 데이터 페칭 시작");

      // 재시도 로직과 함께 실행
      const result = await executeWithRetry(async () => {
        return await asyncFunction({
          signal: abortControllerRef.current.signal
        });
      });

      if (!mounted.current) return;

      console.log("비동기 데이터 페칭 성공:", result ? "데이터 있음" : "데이터 없음");

      // 데이터 변환
      const finalData = transform ? transform(result) : result;

      // 상태 업데이트
      setData(finalData);
      setLastFetch(Date.now());
      setRetryAttempt(0);

      // 캐시에 저장
      setCachedData(finalData);

      // 성공 콜백 실행
      if (onSuccess) {
        onSuccess(finalData);
      }

      return finalData;

    } catch (error) {
      if (!mounted.current) return;

      // 요청이 취소된 경우 무시
      if (error.name === 'AbortError') {
        console.log("요청이 취소되었습니다.");
        return;
      }

      console.error("비동기 데이터 페칭 실패:", error);

      const errorMessage = error.message || "데이터를 불러오는데 실패했습니다.";
      setError(errorMessage);
      setData(null);
      setRetryAttempt(prev => prev + 1);

      // 에러 콜백 실행
      if (onError) {
        onError(error);
      }

      throw error;

    } finally {
      if (mounted.current && showLoading) {
        setLoading(false);
      }
    }
  }, [
    asyncFunction, 
    mounted, 
    getCachedData, 
    clearNotifications, 
    executeWithRetry, 
    transform, 
    onSuccess, 
    onError,
    setCachedData
  ]);

  // 자동 새로고침 설정
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    const interval = setInterval(() => {
      if (mounted.current) {
        fetchData({ useCache: false, showLoading: false });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, fetchData]);

  // 의존성 변경 시 자동 실행
  useEffect(() => {
    if (enabled && asyncFunction && mounted.current) {
      console.log("useEffect: 자동 데이터 페칭 실행");
      fetchData();
    }
  }, [enabled, ...dependencies]);

  // 수동 새로고침 (캐시 무시)
  const refresh = useCallback(() => {
    return fetchData({ useCache: false, showLoading: true });
  }, [fetchData]);

  // 캐시 클리어
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // 상태 리셋
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    clearNotifications();
    setLastFetch(null);
    setRetryAttempt(0);
  }, [initialData, clearNotifications]);

  return {
    // 데이터 상태
    data,
    loading,
    error,
    success,
    info,
    lastFetch,
    retryAttempt,

    // 상태 확인 헬퍼
    isSuccess: !loading && !error && data !== null,
    isError: !loading && !!error,
    isEmpty: !loading && !error && data === null,
    isFresh: lastFetch && (Date.now() - lastFetch) < 60000, // 1분 이내

    // 제어 함수
    execute: fetchData,
    refresh,
    reset,
    clearCache,

    // 알림 관리
    showError,
    showSuccess,
    showInfo,
    clearNotifications,

    // 편의 기능
    retry: () => fetchData({ useCache: false }),
    toggleAutoRefresh: () => setAutoRefresh(prev => !prev),
  };
};

export default useAsyncState;