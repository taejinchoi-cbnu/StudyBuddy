import { useState, useCallback, useEffect } from 'react';

/**
 * 알림 메시지를 관리하는 커스텀 훅
 * 에러, 성공, 정보 메시지를 통합 관리하고 자동 삭제 기능 제공
 */

const useNotification = () => {
  // 메시지 상태들 - 빈 문자열이면 메시지 없음을 의미
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [info, setInfo] = useState("");
  
  // 성공 메시지 자동 삭제 (3초 후)
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3000);
      
      // 컴포넌트 언마운트 시 또는 success가 변경될 때 타이머 정리
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // 정보 메시지 자동 삭제 (5초 후)
  useEffect(() => {
    if (info) {
      const timer = setTimeout(() => {
        setInfo("");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [info]);
  
  // 에러 메시지 표시 함수
  const showError = useCallback((message) => {
    // 다른 메시지들 지우고 에러만 표시
    setSuccess("");
    setInfo("");
    setError(message);
  }, []);

  // 성공 메시지 표시 함수  
  const showSuccess = useCallback((message) => {
    // 다른 메시지들 지우고 성공만 표시
    setError("");
    setInfo("");
    setSuccess(message);
    // 3초 후 자동 삭제는 useEffect에서 처리
  }, []);

  // 정보 메시지 표시 함수
  const showInfo = useCallback((message) => {
    // 다른 메시지들 지우고 정보만 표시
    setError("");
    setSuccess("");
    setInfo(message);
    // 5초 후 자동 삭제는 useEffect에서 처리
  }, []);
  
  // 모든 메시지 지우기
  const clearAll = useCallback(() => {
    setError("");
    setSuccess("");
    setInfo("");
  }, []);
  
  // 개별 메시지 지우기 함수들
  const clearError = useCallback(() => setError(""), []);
  const clearSuccess = useCallback(() => setSuccess(""), []);
  const clearInfo = useCallback(() => setInfo(""), []);
  
  // 메시지 존재 여부 확인 (편의 함수)
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success);
  const hasInfo = Boolean(info);
  const hasAnyMessage = hasError || hasSuccess || hasInfo;
  
  return {
    // 메시지 상태들
    error,
    success, 
    info,
    
    // 메시지 표시 함수들
    showError,
    showSuccess,
    showInfo,
    
    // 메시지 지우기 함수들
    clearAll,
    clearError,
    clearSuccess,
    clearInfo,
    
    // 편의 속성들
    hasError,
    hasSuccess,
    hasInfo,
    hasAnyMessage
  };
};

export default useNotification;