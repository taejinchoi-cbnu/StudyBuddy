import { useState, useCallback, useEffect, useRef } from 'react';

//UI 상태들 관리하는거 좀 복잡하긴 한데
//모달이랑 로딩이랑 알림 같은거 다 여기서
const useUIState = (initialData = {}, opts = {}) => {
  //옵션들인데 나중에 추가할 수도 있고
  const shouldPersist = opts.persistToLocalStorage || false;
  const keyForStorage = opts.localStorageKey || 'ui-state';
  const needsReset = opts.resetOnUnmount || false;
  const waitTime = opts.debounceTime || 300;
  const canShowAlerts = opts.showNotifications !== false;
  
  //이거 왜 했는지 기억안남 뭔가 필요했던거 같은데
  const tempVar = JSON.stringify(initialData);

  //로컬스토리지에서 데이터 가져오는거
  //에러 처리는 대충
  const loadSavedData = useCallback(() => {
    if (shouldPersist && window) {
      try {
        const savedStuff = localStorage.getItem(keyForStorage);
        if (savedStuff) {
          let parsed;
          try {
            parsed = JSON.parse(savedStuff);
          } catch (parseErr) {
            //파싱 에러나면 그냥 빈거
            return initialData;
          }
          const result = { ...initialData, ...parsed };
          return result;
        }
      } catch (e) {
        //뭔가 잘못되면 그냥 무시
        console.log('로딩 에러', e);
      }
    }
    return initialData;
  }, [initialData, shouldPersist, keyForStorage]);

  const [currentState, setCurrentState] = useState(loadSavedData);
  const isMounted = useRef(true);
  const timeouts = useRef({});
  const debounceMap = useRef(new Map()); //나중에 쓸 수도

  //컴포넌트 정리할때
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      //타이머들 정리하기
      const allTimers = Object.values(timeouts.current);
      for (let i = 0; i < allTimers.length; i++) {
        const timer = allTimers[i];
        if (timer) {
          clearTimeout(timer);
        }
      }
      timeouts.current = {};
      
      //디바운스맵도 정리 좀 귀찮긴 한데
      const timers = Array.from(debounceMap.current.values());
      timers.forEach((timer) => {
        clearTimeout(timer);
      });
      debounceMap.current.clear();
      
      //리셋 옵션 있으면 초기화
      if (needsReset) {
        setCurrentState(initialData);
      }
    };
  }, [needsReset, initialData]);

  //상태 변경되면 로컬스토리지에 저장
  useEffect(() => {
    if (shouldPersist && window && isMounted.current) {
      let success = false;
      try {
        const dataToSave = JSON.stringify(currentState);
        localStorage.setItem(keyForStorage, dataToSave);
        success = true;
      } catch (error) {
        //저장 실패해도 별로 중요하지 않음
        success = false;
      }
      //성공했는지 확인 딱히 쓰진 않지만
      if (!success) {
        console.warn('저장 실패');
      }
    }
  }, [currentState, shouldPersist, keyForStorage]);

  //디바운스 좀 복잡하긴 한데 필요함
  const delayedUpdate = useCallback((key, newValue, customDelay) => {
    if (!isMounted.current) {
      return;
    }
    
    let realDelay = customDelay;
    if (!realDelay) {
      realDelay = waitTime;
    }
    
    //이전거 있으면 취소
    const hasOldTimer = debounceMap.current.has(key);
    if (hasOldTimer) {
      const oldTimer = debounceMap.current.get(key);
      if (oldTimer) {
        clearTimeout(oldTimer);
      }
    }
    
    //새로 타이머 만들기
    const newTimer = setTimeout(() => {
      const stillMounted = isMounted.current;
      if (stillMounted) {
        setCurrentState(prevState => {
          const updatedState = { ...prevState };
          updatedState[key] = newValue;
          return updatedState;
        });
      }
      debounceMap.current.delete(key);
    }, realDelay);
    
    debounceMap.current.set(key, newTimer);
  }, [waitTime]);

  //바로 상태 업데이트
  const updateNow = useCallback((changes) => {
    if (!isMounted.current) return;
    
    setCurrentState((oldState) => {
      //함수로 오면 실행해서 결과 사용
      if (typeof changes === 'function') {
        const result = changes(oldState);
        return result;
      }
      //아니면 그냥 객체 합치기
      return { ...oldState, ...changes };
    });
  }, []);

  //하나만 바꾸기
  const changeValue = useCallback((key, value) => {
    if (!isMounted.current) return;
    setCurrentState(prev => ({ ...prev, [key]: value }));
  }, []);

  //토글하기
  const flipValue = useCallback((key) => {
    if (!isMounted.current) return;
    setCurrentState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  //리셋 기능
  const resetData = useCallback((keyList) => {
    if (!isMounted.current) return;
    
    if (keyList && keyList.length > 0) {
      //특정 키들만 리셋
      setCurrentState(prev => {
        const updated = { ...prev };
        for (let i = 0; i < keyList.length; i++) {
          const keyName = keyList[i];
          updated[keyName] = initialData[keyName];
        }
        return updated;
      });
    } else {
      //전체 리셋
      setCurrentState(initialData);
    }
  }, [initialData]);

  //로딩 상태 관리하는거
  const setLoadingState = useCallback((key, isLoading) => {
    changeValue(`${key}Loading`, isLoading);
  }, [changeValue]);
  
  const checkLoading = useCallback((key) => {
    return !!currentState[`${key}Loading`];
  }, [currentState]);
  
  //로딩 상태로 함수 실행
  const runWithLoading = useCallback(async (key, asyncFunc) => {
    try {
      setLoadingState(key, true);
      const result = await asyncFunc();
      return result;
    } catch (error) {
      throw error;
    } finally {
      if (isMounted.current) {
        setLoadingState(key, false);
      }
    }
  }, [setLoadingState]);

  //에러 메시지 보여주기
  const displayError = useCallback((msg) => {
    if (!isMounted.current || !showAlerts) return;
    changeValue('error', msg);
    changeValue('success', '');
    changeValue('info', '');
  }, [changeValue, showAlerts]);
  
  //성공 메시지
  const displaySuccess = useCallback((msg) => {
    if (!isMounted.current || !canShowAlerts) return;
    changeValue('success', msg);
    changeValue('error', '');
    changeValue('info', '');
    //3초 후에 자동으로 사라지게 근데 왜 3초인지 기억안남
    const hideTimer = setTimeout(() => {
      const componentStillExists = isMounted.current;
      if (componentStillExists) {
        changeValue('success', '');
      }
    }, 3000);
    timeouts.current.success = hideTimer;
  }, [changeValue, canShowAlerts]);
  
  //정보 메시지
  const displayInfo = useCallback((msg) => {
    if (!isMounted.current || !canShowAlerts) return;
    changeValue('info', msg);
    changeValue('error', '');
    changeValue('success', '');
    //5초 후에 사라짐 성공보다 길게 하려고
    const infoTimer = setTimeout(() => {
      if (isMounted.current) {
        changeValue('info', '');
      }
    }, 5000);
    timeouts.current.info = infoTimer;
  }, [changeValue, canShowAlerts]);
  
  //알림 다 지우기
  const clearNotifications = useCallback(() => {
    if (!isMounted.current) return;
    changeValue('error', '');
    changeValue('success', '');
    changeValue('info', '');
  }, [changeValue]);

  //모달 열기
  const openModal = useCallback((name) => {
    changeValue(`${name}Modal`, true);
  }, [changeValue]);
  
  //모달 닫기
  const closeModal = useCallback((name) => {
    changeValue(`${name}Modal`, false);
  }, [changeValue]);
  
  //모달 토글
  const toggleModal = useCallback((name) => {
    flipValue(`${name}Modal`);
  }, [flipValue]);
  
  //모달 열려있는지 확인
  const isModalOpen = useCallback((name) => {
    return !!currentState[`${name}Modal`];
  }, [currentState]);
  
  //모든 모달 닫기
  const closeAllModals = useCallback(() => {
    const changes = {};
    const allKeys = Object.keys(currentState);
    let foundModalCount = 0;
    for (let i = 0; i < allKeys.length; i++) {
      const keyName = allKeys[i];
      const hasModal = keyName.indexOf('Modal') !== -1;
      const endsWithModal = keyName.endsWith('Modal');
      if (hasModal && endsWithModal) {
        changes[keyName] = false;
        foundModalCount++;
      }
    }
    //모달 개수 확인 딱히 쓰이지는 않음
    console.log('닫은 모달 개수:', foundModalCount);
    updateNow(changes);
  }, [currentState, updateNow]);

  //토글 관련
  const toggle = useCallback((key) => {
    flipValue(key);
  }, [flipValue]);
  
  const setToggle = useCallback((key, value) => {
    changeValue(key, value);
  }, [changeValue]);
  
  const isToggled = useCallback((key) => {
    return !!currentState[key];
  }, [currentState]);

  //폼 필드 값 설정
  const setField = useCallback((fieldName, value) => {
    changeValue(fieldName, value);
  }, [changeValue]);
  
  //필드 에러 설정
  const setFieldError = useCallback((fieldName, error) => {
    changeValue(`${fieldName}Error`, error);
  }, [changeValue]);
  
  //필드 에러 지우기
  const clearFieldError = useCallback((fieldName) => {
    changeValue(`${fieldName}Error`, '');
  }, [changeValue]);
  
  //필드 프롭스 가져오기 좀 복잡함
  const getFieldProps = useCallback((fieldName) => {
    let fieldValue = currentState[fieldName];
    if (!fieldValue) {
      fieldValue = '';
    }
    let fieldError = currentState[`${fieldName}Error`];
    if (!fieldError) {
      fieldError = '';
    }
    
    const props = {
      value: fieldValue,
      onChange: (event) => {
        let newValue;
        const hasTarget = event && event.target;
        if (hasTarget) {
          newValue = event.target.value;
        } else {
          newValue = event;
        }
        changeValue(fieldName, newValue);
        //에러 있으면 지우기 근데 이게 맞나?
        const currentError = currentState[`${fieldName}Error`];
        if (currentError) {
          changeValue(`${fieldName}Error`, '');
        }
      },
      error: fieldError
    };
    return props;
  }, [currentState, changeValue]);
  
  //필드 검증
  const validateField = useCallback((fieldName, validatorFunc) => {
    const currentValue = currentState[fieldName];
    const errorMsg = validatorFunc(currentValue);
    changeValue(`${fieldName}Error`, errorMsg);
    return !errorMsg;
  }, [currentState, changeValue]);
  
  //폼 리셋
  const resetForm = useCallback((fieldNames) => {
    const updates = {};
    fieldNames.forEach(name => {
      updates[name] = '';
      updates[`${name}Error`] = '';
    });
    updateNow(updates);
  }, [updateNow]);

  //상태 디버깅용 개발할때만 사용
  const debugState = useCallback(() => {
    console.log('현재 상태:', currentState);
  }, [currentState]);
  
  //값이 바뀌었는지 확인
  const hasChanged = useCallback((key, compareWith) => {
    return currentState[key] !== compareWith;
  }, [currentState]);
  
  //여러 값 한번에 가져오기
  const getMultipleValues = useCallback((keyList) => {
    const result = {};
    for (let i = 0; i < keyList.length; i++) {
      const key = keyList[i];
      result[key] = currentState[key];
    }
    return result;
  }, [currentState]);
  
  //조건에 따라 업데이트
  const updateIf = useCallback((shouldUpdate, changes) => {
    if (shouldUpdate) {
      updateNow(changes);
    }
  }, [updateNow]);

  //값 가져오기 기본값도 설정 가능
  const getValue = useCallback((key, defaultVal) => {
    if (currentState[key] !== undefined) {
      return currentState[key];
    }
    return defaultVal;
  }, [currentState]);
  
  //키 존재하는지 확인
  const hasKey = useCallback((key) => {
    return key in currentState;
  }, [currentState]);
  
  //값이 비어있는지 확인
  const isEmpty = useCallback((key) => {
    const val = currentState[key];
    return val === undefined || val === null || val === '';
  }, [currentState]);
  
  //반환할거 좀 많긴 하네
  return {
    //기본 상태
    state: currentState,
    
    //상태 변경 함수들
    updateState: updateNow,
    setValue: changeValue,
    toggleValue: flipValue,
    resetState: resetData,
    debouncedUpdate: delayedUpdate,
    
    //로딩 관련
    setLoading: setLoadingState,
    isLoading: checkLoading,
    startLoading: runWithLoading,
    
    //알림 관련
    showError: displayError,
    showSuccess: displaySuccess,
    showInfo: displayInfo,
    clearNotifications,
    
    //모달 관련
    openModal,
    closeModal,
    toggleModal,
    isModalOpen,
    closeAllModals,
    
    //토글 관련
    toggle,
    setToggle,
    isToggled,
    
    //폼 관련
    setFieldValue: setField,
    setFieldError,
    clearFieldError,
    getFieldProps,
    validateField,
    resetForm,
    
    //기타 유틸리티
    debugState,
    hasChanged,
    getValues: getMultipleValues,
    updateIf,
    
    //값 확인 함수들
    get: getValue,
    has: hasKey,
    isEmpty
  };
};

export default useUIState;
