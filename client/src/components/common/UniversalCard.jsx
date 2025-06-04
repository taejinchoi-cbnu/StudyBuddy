import { useDarkMode } from "../../contexts/DarkModeContext";

/**
 * 간소화된 통합 카드 컴포넌트
 * Dashboard, Group, Feature 카드를 통합하되 복잡성 제거
 */
const UniversalCard = ({ 
  // 필수 props만 유지
  variant = "default", // "dashboard", "group", "feature", "default"
  title,
  icon,
  headerAction,
  children,
  onClick,
  className = "",
  ...props 
}) => {
  const { darkMode } = useDarkMode();
  
  // 카드 유형별 기본 클래스 설정 (간소화)
  const getCardClasses = () => {
    const baseClass = "universal-card";
    const variantClass = variant !== "default" ? `universal-card-${variant}` : "";
    const darkModeClass = darkMode ? "dark-mode" : "";
    const clickableClass = onClick ? "clickable" : "";
    
    return `${baseClass} ${variantClass} ${darkModeClass} ${clickableClass} ${className}`.trim();
  };
  
  // 카드 헤더 렌더링 (간소화)
  const renderHeader = () => {
    if (!title && !icon && !headerAction) return null;
    
    return (
      <div className="universal-card-header">
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