import { useDarkMode } from "../../contexts/DarkModeContext";

// 통합 카드 컴포넌트

const UniversalCard = ({ 
  variant = "default", // "dashboard", "group", "feature", "default"
  title,
  icon,
  headerAction,
  children,
  onClick,
  className = "",
  headerClassName = "", // 헤더 전용 클래스명 prop 추가
  ...props 
}) => {
  const { darkMode } = useDarkMode();
  
  // 카드 유형별 기본 클래스 설정
  const getCardClasses = () => {
    const baseClass = "universal-card";
    const variantClass = variant !== "default" ? `universal-card-${variant}` : "";
    const darkModeClass = darkMode ? "dark-mode" : "";
    const clickableClass = onClick ? "clickable" : "";
    
    return `${baseClass} ${variantClass} ${darkModeClass} ${clickableClass} ${className}`.trim();
  };
  
  // 카드 헤더 렌더링
  const renderHeader = () => {
    if (!title && !icon && !headerAction) return null;
    
    return (
      <div className={`universal-card-header ${headerClassName}`}>
        <div className="card-header-left">
          {icon && <i className={`${icon} me-2`}></i>}
          {title && <h5 className="card-title">{title}</h5>}
        </div>
        {headerAction && (
          <div className="card-header-actions">
            {headerAction}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div 
      className={getCardClasses()}
      onClick={onClick}
      {...props}
    >
      {renderHeader()}
      <div className="universal-card-content">
        {children}
      </div>
    </div>
  );
};

export default UniversalCard;