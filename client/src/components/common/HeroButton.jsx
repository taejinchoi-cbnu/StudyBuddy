import { useDarkMode } from "../../contexts/DarkModeContext";

const HeroButton = ({ 
  variant = "primary", 
  onClick, 
  children, 
  className = "",
  ...props 
}) => {
  const { darkMode } = useDarkMode();
  
  const baseClass = "hero-button";
  const variantClass = `${baseClass}-${variant}`;
  const darkModeClass = darkMode ? "dark-mode" : "";
  
  return (
    <button
      type="button"
      className={`${baseClass} ${variantClass} ${darkModeClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default HeroButton;