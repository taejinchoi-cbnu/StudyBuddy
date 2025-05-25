import { useState, useEffect, useCallback } from "react";

/**
 * Firebase 데이터 페칭을 위한 커스텀 훅
 * 
 * @param {Function} fetchFunction - 실행할 Firebase 함수 (예: () => getGroupById(groupId))
 * @param {Array} dependencies - useEffect 의존성 배열 (예: [groupId])
 * @param {Object} options - 추가 옵션들
 * @param {boolean} options.enabled - 자동 실행 여부 (기본값: true)
 * @param {Function} options.onSuccess - 성공 시 실행할 콜백
 * @param {Function} options.onError - 에러 시 실행할 콜백  
 * @param {Function} options.transform - 데이터 변환 함수
 * @param {any} options.initialData - 초기 데이터 값
 * 
 * @returns {Object} { data, loading, error, refetch }
 */
const useFirebaseData = (fetchFunction, dependencies = [], options = {}) => {
  // 1단계: 기본 상태 정의
  // data: Firebase에서 가져온 데이터를 저장
  // loading: 현재 데이터를 가져오는 중인지 여부
  // error: 에러가 발생했을 때 에러 메시지 저장
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 2단계: 옵션들 구조 분해 (기본값 설정)
  const {
    enabled = true,           // 자동으로 데이터를 가져올지 여부
    onSuccess,               // 성공했을 때 실행할 함수
    onError,                 // 에러가 발생했을 때 실행할 함수
    transform,               // 데이터를 변환할 함수
    initialData = null       // 처음 데이터 상태값
  } = options;

  // 3단계: 실제 데이터를 가져오는 함수 정의 (무한 루프 방지를 위해 의존성 최적화)
  const fetchData = useCallback(async () => {
    // fetchFunction이 없으면 실행하지 않음
    if (!fetchFunction) {
      console.warn("useFirebaseData: fetchFunction이 제공되지 않았습니다.");
      return;
    }

    try {
      // 로딩 시작
      setLoading(true);
      // 이전 에러 메시지 지우기
      setError("");
      
      console.log("Firebase 데이터 가져오기 시작");
      
      // 실제 Firebase 함수 실행 (예: getGroupById(groupId))
      const result = await fetchFunction();
      
      console.log("Firebase 데이터 가져오기 성공:", result);
      
      // 데이터 변환이 필요한 경우 transform 함수 적용
      const finalData = transform ? transform(result) : result;
      
      // 가져온 데이터를 상태에 저장
      setData(finalData);
      
      // 성공 콜백이 있으면 실행
      if (onSuccess) {
        onSuccess(finalData);
      }
      
    } catch (error) {
      console.error("Firebase 데이터 가져오기 실패:", error);
      
      // 에러 메시지 설정
      const errorMessage = error.message || "데이터를 불러오는데 실패했습니다.";
      setError(errorMessage);
      
      // 에러 발생 시 데이터를 null로 초기화
      setData(null);
      
      // 에러 콜백이 있으면 실행
      if (onError) {
        onError(error);
      }
      
    } finally {
      // 성공이든 실패든 로딩 상태 종료
      setLoading(false);
      console.log("Firebase 데이터 가져오기 완료");
    }
  }, [fetchFunction, transform]); // onSuccess, onError는 의존성에서 제거하여 무한 루프 방지

  // 4단계: 자동으로 데이터 가져오기 (useEffect 최적화)
  useEffect(() => {
    // enabled가 true이고 fetchFunction이 있을 때만 자동 실행
    if (enabled && fetchFunction) {
      console.log("useEffect: 자동 데이터 가져오기 실행");
      fetchData();
    } else {
      console.log("useEffect: 조건이 맞지 않아 실행하지 않음", { enabled, fetchFunction: !!fetchFunction });
    }
  }, [enabled, ...dependencies]); // fetchData는 의존성에서 제거하여 무한 루프 방지

  // 5단계: 컴포넌트에서 사용할 수 있는 값들과 함수들 반환
  return {
    data,              // 가져온 데이터
    loading,           // 로딩 중인지 여부
    error,             // 에러 메시지 (없으면 빈 문자열)
    refetch: fetchData, // 수동으로 데이터를 다시 가져오는 함수
    
    // 추가 편의 기능들
    isSuccess: !loading && !error && data !== null,  // 성공적으로 데이터를 가져왔는지
    isError: !loading && !!error,                    // 에러가 발생했는지
    isEmpty: !loading && !error && data === null,    // 데이터가 비어있는지
  };
};

export default useFirebaseData;