import { useRef, useEffect } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";

const AnimatedSection = ({ 
  children, 
  className = "", 
  animationClass = "animate-in",
  threshold = 0.7,
  ...props 
}) => {
  const { darkMode } = useDarkMode();
  const sectionRef = useRef(null);
  
  useEffect(() => {
    const currentRef = sectionRef.current;
    if (!currentRef) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 섹션 자체에 애니메이션 클래스 추가
          entry.target.classList.add(animationClass);
          
          // animate-target 클래스를 가진 자식 요소들에도 애니메이션 적용
          const animateTargets = entry.target.querySelectorAll('.animate-target');
          animateTargets.forEach((target, index) => {
            setTimeout(() => {
              target.classList.add(animationClass);
            }, index * 300); // 순차적 애니메이션
          });
        }
      },
      { threshold }
    );
    
    observer.observe(currentRef);
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [animationClass, threshold]);
  
  return (
    <section 
      ref={sectionRef}
      className={`animated-section ${className} ${darkMode ? "dark-mode" : ""}`}
      {...props}
    >
      {children}
    </section>
  );
};

export default AnimatedSection;