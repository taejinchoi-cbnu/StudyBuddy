import { useState, useCallback, useEffect } from 'react';

const useNotification = () => {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (infoMsg) {
      const timer = setTimeout(() => setInfoMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [infoMsg]);

  const displayError = useCallback((msg) => {
    setSuccessMsg('');
    setInfoMsg('');
    setErrorMsg(msg);
  }, []);

  const displaySuccess = useCallback((msg) => {
    setErrorMsg('');
    setInfoMsg('');
    setSuccessMsg(msg);
  }, []);

  const displayInfo = useCallback((msg) => {
    setErrorMsg('');
    setSuccessMsg('');
    setInfoMsg(msg);
  }, []);

  const resetAll = useCallback(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setInfoMsg('');
  }, []);

  const resetError = useCallback(() => setErrorMsg(''), []);
  const resetSuccess = useCallback(() => setSuccessMsg(''), []);
  const resetInfo = useCallback(() => setInfoMsg(''), []);

  return {
    error: errorMsg,
    success: successMsg,
    info: infoMsg,
    showError: displayError,
    showSuccess: displaySuccess,
    showInfo: displayInfo,
    clearAll: resetAll,
    clearError: resetError,
    clearSuccess: resetSuccess,
    clearInfo: resetInfo,
    hasError: !!errorMsg,
    hasSuccess: !!successMsg,
    hasInfo: !!infoMsg,
    hasAnyMessage: !!(errorMsg || successMsg || infoMsg),
  };
};

export default useNotification;
