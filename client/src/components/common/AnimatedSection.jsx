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
          entry.target.classList.add(animationClass);
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