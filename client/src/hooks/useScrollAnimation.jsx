import { useEffect, useRef, useCallback } from "react";

const useScrollAnimation = (threshold = 0.8) => {
  const elementsRef = useRef([]);
  
  // ref를 배열에 추가하는 함수
  const addToRefs = useCallback((el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  }, []);
  
  useEffect(() => {
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersection, {
      threshold
    });
    
    // 모든 요소에 observer 적용
    elementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    
    return () => {
      elementsRef.current.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [threshold]);
  
  return { addToRefs };
};

export default useScrollAnimation;