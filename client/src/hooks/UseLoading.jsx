import { useState, useRef, useEffect } from 'react';

const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(true);
  
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);
  
  const startLoading = async (promise) => {
    if (!mounted.current) return;
    
    setIsLoading(true);
    try {
      const result = await promise;
      return result;
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };
  
  return [isLoading, startLoading];
};

export default useLoading;