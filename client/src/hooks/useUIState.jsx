import { useState, useCallback, useEffect, useRef } from "react";

/**
 * 통합 UI 상태 관리 훅
 * 모달, 로딩, 알림, 토글, 폼 상태 등을 모두 처리
 * 
 * @param {Object} initialState - 초기 상태 객체
 * @param {Object} options - 추가 옵션들
 * @returns {Object} 상태와 제어 함수들
 */
const useUIState = (initialState = {}, options = {}) => {
  const {
    persistToLocalStorage = false,
    localStorageKey = "ui-state",
    resetOnUnmount = false,
    debounceTime = 300,
    showNotifications = true,
  } = options;

  // 로컬 스토리지에서 초기 상태 로드
  const getInitialState = useCallback(() => {
    if (persistToLocalStorage && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(localStorageKey);
        if (saved) {
          return { ...initialState, ...JSON.parse(saved) };
        }
      } catch (error) {
        console.error("로컬 스토리지에서 상태 로드 실패:", error);
      }
    }
    return initialState;
  }, [initialState, persistToLocalStorage, localStorageKey]);

  const [state, setState] = useState(getInitialState);
  const mounted = useRef(true);
  const debounceTimeouts = useRef(new Map());

  // 컴포넌트 언마운트 처리
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // 모든 디바운스 타이머 정리
      debounceTimeouts.current.forEach(timeout => clearTimeout(timeout));
      debounceTimeouts.current.clear();
      
      // 언마운트 시 상태 리셋 (옵션)
      if (resetOnUnmount) {
        setState(initialState);
      }
    };
  }, [resetOnUnmount, initialState]);

  // 로컬 스토리지에 상태 저장
  useEffect(() => {
    if (persistToLocalStorage && typeof window !== "undefined" && mounted.current) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(state));
      } catch (error) {
        console.error("로컬 스토리지에 상태 저장 실패:", error);
      }
    }
  }, [state, persistToLocalStorage, localStorageKey]);

  // 디바운스된 상태 업데이트
  const debouncedUpdate = useCallback((key, value, delay = debounceTime) => {
    if (!mounted.current) return;

    // 이전 타이머 취소
    if (debounceTimeouts.current.has(key)) {
      clearTimeout(debounceTimeouts.current.get(key));
    }

    // 새 타이머 설정
    const timeout = setTimeout(() => {
      if (mounted.current) {
        setState(prev => ({ ...prev, [key]: value }));
      }
      debounceTimeouts.current.delete(key);
    }, delay);

    debounceTimeouts.current.set(key, timeout);
  }, [debounceTime]);

  // 즉시 상태 업데이트
  const updateState = useCallback((updates) => {
    if (!mounted.current) return;
    
    setState(prev => {
      if (typeof updates === "function") {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  // 특정 키의 상태 업데이트
  const setValue = useCallback((key, value) => {
    if (!mounted.current) return;
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // 특정 키의 상태 토글
  const toggleValue = useCallback((key) => {
    if (!mounted.current) return;
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // 상태 리셋
  const resetState = useCallback((keysToReset) => {
    if (!mounted.current) return;
    
    if (keysToReset && Array.isArray(keysToReset)) {
      // 특정 키들만 리셋
      setState(prev => {
        const newState = { ...prev };
        keysToReset.forEach(key => {
          newState[key] = initialState[key];
        });
        return newState;
      });
    } else {
      // 전체 리셋
      setState(initialState);
    }
  }, [initialState]);

  // 로딩 관리 헬퍼 함수들
  const loadingHelpers = {
    setLoading: useCallback((key, loading) => {
      setValue(`${key}Loading`, loading);
    }, [setValue]),

    isLoading: useCallback((key) => {
      return !!state[`${key}Loading`];
    }, [state]),

    startLoading: useCallback(async (key, asyncFn) => {
      try {
        loadingHelpers.setLoading(key, true);
        const result = await asyncFn();
        return result;
      } finally {
        if (mounted.current) {
          loadingHelpers.setLoading(key, false);
        }
      }
    }, [setValue]),
  };

  // 알림 관리 헬퍼 함수들
  const notificationHelpers = {
    showError: useCallback((message) => {
      if (!mounted.current || !showNotifications) return;
      setValue("error", message);
      setValue("success", "");
      setValue("info", "");
    }, [setValue, showNotifications]),

    showSuccess: useCallback((message) => {
      if (!mounted.current || !showNotifications) return;
      setValue("success", message);
      setValue("error", "");
      setValue("info", "");
      setTimeout(() => {
        if (mounted.current) setValue("success", "");
      }, 3000);
    }, [setValue, showNotifications]),

    showInfo: useCallback((message) => {
      if (!mounted.current || !showNotifications) return;
      setValue("info", message);
      setValue("error", "");
      setValue("success", "");
      setTimeout(() => {
        if (mounted.current) setValue("info", "");
      }, 5000);
    }, [setValue, showNotifications]),

    clearAll: useCallback(() => {
      if (!mounted.current) return;
      setValue("error", "");
      setValue("success", "");
      setValue("info", "");
    }, [setValue]),
  };

  // 모달 관리 헬퍼 함수들
  const modalHelpers = {
    openModal: useCallback((modalName) => {
      setValue(`${modalName}Modal`, true);
    }, [setValue]),

    closeModal: useCallback((modalName) => {
      setValue(`${modalName}Modal`, false);
    }, [setValue]),

    toggleModal: useCallback((modalName) => {
      toggleValue(`${modalName}Modal`);
    }, [toggleValue]),

    isModalOpen: useCallback((modalName) => {
      return !!state[`${modalName}Modal`];
    }, [state]),

    closeAllModals: useCallback(() => {
      const updates = {};
      Object.keys(state).forEach(key => {
        if (key.endsWith('Modal')) {
          updates[key] = false;
        }
      });
      updateState(updates);
    }, [state, updateState]),
  };

  // 토글 관리 헬퍼 함수들
  const toggleHelpers = {
    toggle: useCallback((key) => {
      toggleValue(key);
    }, [toggleValue]),

    setToggle: useCallback((key, value) => {
      setValue(key, value);
    }, [setValue]),

    isToggled: useCallback((key) => {
      return !!state[key];
    }, [state]),
  };

  // 폼 상태 관리 헬퍼 함수들
  const formHelpers = {
    setFieldValue: useCallback((fieldName, value) => {
      setValue(fieldName, value);
    }, [setValue]),

    setFieldError: useCallback((fieldName, error) => {
      setValue(`${fieldName}Error`, error);
    }, [setValue]),

    clearFieldError: useCallback((fieldName) => {
      setValue(`${fieldName}Error`, "");
    }, [setValue]),

    getFieldProps: useCallback((fieldName) => ({
      value: state[fieldName] || "",
      onChange: (e) => {
        const value = e.target ? e.target.value : e;
        setValue(fieldName, value);
        // 에러 클리어
        if (state[`${fieldName}Error`]) {
          setValue(`${fieldName}Error`, "");
        }
      },
      error: state[`${fieldName}Error`] || "",
    }), [state, setValue]),

    validateField: useCallback((fieldName, validator) => {
      const value = state[fieldName];
      const error = validator(value);
      setValue(`${fieldName}Error`, error);
      return !error;
    }, [state, setValue]),

    resetForm: useCallback((fieldNames) => {
      const updates = {};
      fieldNames.forEach(fieldName => {
        updates[fieldName] = "";
        updates[`${fieldName}Error`] = "";
      });
      updateState(updates);
    }, [updateState]),
  };

  // 편의 기능들
  const utilities = {
    // 상태 디버깅
    debugState: useCallback(() => {
      console.log("Current UI State:", state);
    }, [state]),

    // 상태 변화 감지
    hasChanged: useCallback((key, compareValue) => {
      return state[key] !== compareValue;
    }, [state]),

    // 여러 상태 값 한번에 가져오기
    getValues: useCallback((keys) => {
      return keys.reduce((acc, key) => {
        acc[key] = state[key];
        return acc;
      }, {});
    }, [state]),

    // 조건부 상태 업데이트
    updateIf: useCallback((condition, updates) => {
      if (condition) {
        updateState(updates);
      }
    }, [updateState]),
  };

  return {
    // 현재 상태
    state,

    // 기본 상태 관리
    updateState,
    setValue,
    toggleValue,
    resetState,
    debouncedUpdate,

    // 전문화된 헬퍼들
    ...modalHelpers,
    ...loadingHelpers,
    ...notificationHelpers,
    ...toggleHelpers,
    ...formHelpers,
    ...utilities,

    // 상태 확인 편의 기능
    get: useCallback((key, defaultValue) => {
      return state[key] !== undefined ? state[key] : defaultValue;
    }, [state]),

    has: useCallback((key) => {
      return key in state;
    }, [state]),

    isEmpty: useCallback((key) => {
      const value = state[key];
      return value === undefined || value === null || value === "";
    }, [state]),
  };
};

export default useUIState;