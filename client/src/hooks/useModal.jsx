import { useState, useCallback, useEffect } from 'react';

/**
 * 모달 상태를 관리하는 커스텀 훅
 * 단일 모달과 다중 모달 관리를 모두 지원
 * 
 * @param {string|Array} modalNames - 관리할 모달 이름(들)
 * @returns {Object} 모달 상태와 제어 함수들
 */

const useModal = (modalNames) => {
  // 단일 모달인지 다중 모달인지 판단
  const isMultiple = Array.isArray(modalNames);
  
  // 다중 모달의 경우: 객체 형태로 상태 관리
  // 단일 모달의 경우: boolean 형태로 상태 관리
  const [modalStates, setModalStates] = useState(() => {
    if (isMultiple) {
      // 다중 모달: { login: false, signup: false, forgot: false }
      return modalNames.reduce((acc, name) => {
        acc[name] = false;
        return acc;
      }, {});
    } else {
      // 단일 모달: false
      return false;
    }
  });
  
  // 현재 열려있는 모달 이름 추적 (다중 모달용)
  const [activeModal, setActiveModal] = useState(null);
  
  // 단일 모달 열기
  const open = useCallback(() => {
    if (!isMultiple) {
      setModalStates(true);
    }
  }, [isMultiple]);
  
  // 단일 모달 닫기
  const close = useCallback(() => {
    if (!isMultiple) {
      setModalStates(false);
    }
  }, [isMultiple]);
  
  // 단일 모달 토글
  const toggle = useCallback(() => {
    if (!isMultiple) {
      setModalStates(prev => !prev);
    }
  }, [isMultiple]);
  
  // 특정 모달 열기 (다중 모달용)
  const openModal = useCallback((modalName) => {
    if (isMultiple && modalNames.includes(modalName)) {
      setModalStates(prev => ({
        ...prev,
        [modalName]: true
      }));
      setActiveModal(modalName);
    }
  }, [isMultiple, modalNames]);
  
  // 특정 모달 닫기 (다중 모달용)
  const closeModal = useCallback((modalName) => {
    if (isMultiple && modalNames.includes(modalName)) {
      setModalStates(prev => ({
        ...prev,
        [modalName]: false
      }));
      
      // 닫힌 모달이 활성 모달이었다면 activeModal 초기화
      if (activeModal === modalName) {
        setActiveModal(null);
      }
    }
  }, [isMultiple, modalNames, activeModal]);
  
  // 특정 모달 토글 (다중 모달용)
  const toggleModal = useCallback((modalName) => {
    if (isMultiple && modalNames.includes(modalName)) {
      setModalStates(prev => {
        const newState = !prev[modalName];
        
        if (newState) {
          setActiveModal(modalName);
        } else if (activeModal === modalName) {
          setActiveModal(null);
        }
        
        return {
          ...prev,
          [modalName]: newState
        };
      });
    }
  }, [isMultiple, modalNames, activeModal]);
  
  // 모든 모달 닫기 (다중 모달용)
  const closeAllModals = useCallback(() => {
    if (isMultiple) {
      setModalStates(prev => {
        const closedStates = {};
        Object.keys(prev).forEach(key => {
          closedStates[key] = false;
        });
        return closedStates;
      });
      setActiveModal(null);
    } else {
      setModalStates(false);
    }
  }, [isMultiple]);
  
  // 모달 간 전환 (다중 모달용) - 현재 모달 닫고 새 모달 열기
  const switchModal = useCallback((fromModal, toModal) => {
    if (isMultiple && modalNames.includes(fromModal) && modalNames.includes(toModal)) {
      setModalStates(prev => ({
        ...prev,
        [fromModal]: false,
        [toModal]: true
      }));
      setActiveModal(toModal);
    }
  }, [isMultiple, modalNames]);
  
  // 특정 모달이 열려있는지 확인 (다중 모달용)
  const isOpen = useCallback((modalName) => {
    if (isMultiple) {
      return modalStates[modalName] || false;
    } else {
      return modalStates;
    }
  }, [isMultiple, modalStates]);
  
  // 어떤 모달이라도 열려있는지 확인
  const hasOpenModal = useCallback(() => {
    if (isMultiple) {
      return Object.values(modalStates).some(state => state === true);
    } else {
      return modalStates;
    }
  }, [isMultiple, modalStates]);
  
  // ESC 키로 모달 닫기 기능 (선택사항)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && hasOpenModal()) {
        if (isMultiple && activeModal) {
          closeModal(activeModal);
        } else if (!isMultiple) {
          close();
        }
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [hasOpenModal, isMultiple, activeModal, closeModal, close]);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 언마운트 시 모든 모달 상태 정리
      closeAllModals();
    };
  }, [closeAllModals]);
  
  // 반환 객체 - 사용 방식에 따라 다른 인터페이스 제공
  if (isMultiple) {
    // 다중 모달 인터페이스
    return {
      // 상태 확인
      modalStates,           // 전체 모달 상태 객체
      activeModal,           // 현재 활성 모달 이름
      isOpen,               // 특정 모달 열림 상태 확인 함수
      hasOpenModal,         // 어떤 모달이라도 열려있는지 확인
      
      // 개별 모달 제어
      openModal,            // 특정 모달 열기
      closeModal,           // 특정 모달 닫기  
      toggleModal,          // 특정 모달 토글
      
      // 전체 모달 제어
      closeAllModals,       // 모든 모달 닫기
      switchModal,          // 모달 간 전환
      
      // 편의 함수들 (자주 사용되는 패턴)
      openOnly: (modalName) => {
        closeAllModals();
        openModal(modalName);
      },
    };
  } else {
    // 단일 모달 인터페이스
    return {
      // 상태
      isOpen: modalStates,  // boolean 상태
      
      // 제어 함수
      open,                 // 모달 열기
      close,                // 모달 닫기
      toggle,               // 모달 토글
    };
  }
};

export default useModal;