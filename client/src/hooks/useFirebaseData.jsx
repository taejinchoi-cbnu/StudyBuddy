import { useState, useEffect, useCallback } from 'react';

const useFirebaseData = (fetchFunc, deps = [], opts = {}) => {
  const [fbData, setFbData] = useState(opts.initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const {
    enabled = true,
    onSuccess,
    onError,
    transform,
    initialData = null,
  } = opts;

  const loadData = useCallback(async () => {
    if (!fetchFunc) return;

    try {
      setIsLoading(true);
      setErrMsg('');

      const result = await fetchFunc();
      const processedData = transform ? transform(result) : result;

      setFbData(processedData);

      if (onSuccess) {
        onSuccess(processedData);
      }
    } catch (err) {
      const msg = err.message || '데이터 로드 실패';
      setErrMsg(msg);
      setFbData(null);

      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunc, transform]);

  useEffect(() => {
    if (enabled && fetchFunc) {
      loadData();
    }
  }, [enabled, ...deps]);

  return {
    data: fbData,
    loading: isLoading,
    error: errMsg,
    refetch: loadData,
    isSuccess: !isLoading && !errMsg && fbData !== null,
    isError: !isLoading && !!errMsg,
    isEmpty: !isLoading && !errMsg && fbData === null,
  };
};

export default useFirebaseData;
