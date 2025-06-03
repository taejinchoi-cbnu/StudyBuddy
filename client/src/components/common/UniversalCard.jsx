import { useDarkMode } from "../../contexts/DarkModeContext";

/**
 * 통합 카드 컴포넌트 - 모든 카드 유형을 하나로 통합
 * GroupCard, DashboardCard, FeatureCard를 대체
 */
const UniversalCard = ({ 
  // 카드 유형 및 스타일
  variant = "default", // "group", "dashboard", "feature", "default"
  
  // 헤더 관련
  title,
  subtitle,
  icon,
  headerAction,
  
  // 콘텐츠 관련
  children,
  description,
  image,
  imageAlt,
  
  // 메타데이터 (그룹 카드용)
  tags = [],
  badges = [],
  metadata,
  
  // 특징 목록 (feature 카드용)
  benefits = [],
  
  // 상호작용
  onClick,
  href,
  
  // 스타일링
  className = "",
  minHeight = "auto",
  
  // 기타 속성
  ...props 
}) => {
  const { darkMode } = useDarkMode();
  
  // 카드 유형별 기본 클래스 설정
  const getVariantClasses = () => {
    const baseClasses = "universal-card";
    const darkModeClass = darkMode ? "dark-mode" : "";
    
    switch (variant) {
      case "group":
        return `${baseClasses} universal-card-group ${darkModeClass}`;
      case "dashboard":
        return `${baseClasses} universal-card-dashboard ${darkModeClass}`;
      case "feature":
        return `${baseClasses} universal-card-feature ${darkModeClass}`;
      default:
        return `${baseClasses} universal-card-default ${darkModeClass}`;
    }
  };
  
  // 클릭 핸들러
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };
  
  // 카드 헤더 렌더링
  const renderHeader = () => {
    if (!title && !icon && !headerAction) return null;
    
    return (
      <div className="universal-card-header">
        <div className="card-header-left">
          {icon && <i className={`${icon} me-2`}></i>}
          <div className="card-title-section">
            {title && <h5 className="card-title-universal">{title}</h5>}
            {subtitle && <p className="card-subtitle-universal">{subtitle}</p>}
          </div>
        </div>
        {headerAction && (
          <div className="card-header-actions">
            {headerAction}
          </div>
        )}
      </div>
    );
  };
  
  // 이미지 섹션 렌더링 (feature 카드용)
  const renderImage = () => {
    if (!image) return null;
    
    return (
      <div className="universal-card-image">
        <img 
          src={image} 
          alt={imageAlt || "카드 이미지"} 
          className="card-image"
        />
      </div>
    );
  };
  
  // 설명 텍스트 렌더링
  const renderDescription = () => {
    if (!description) return null;
    
    return (
      <div className="universal-card-description">
        <p>{description}</p>
      </div>
    );
  };
  
  // 태그 섹션 렌더링
  const renderTags = () => {
    if (!tags || tags.length === 0) return null;
    
    return (
      <div className="universal-card-tags">
        {tags.map((tag, index) => (
          <span key={index} className="card-tag">
            {tag}
          </span>
        ))}
      </div>
    );
  };
  
  // 배지 섹션 렌더링
  const renderBadges = () => {
    if (!badges || badges.length === 0) return null;
    
    return (
      <div className="universal-card-badges">
        {badges.map((badge, index) => (
          <span 
            key={index} 
            className={`card-badge ${badge.variant || "primary"}`}
          >
            {badge.text || badge}
          </span>
        ))}
      </div>
    );
  };
  
  // 메타데이터 섹션 렌더링 (그룹 카드용)
  const renderMetadata = () => {
    if (!metadata) return null;
    
    return (
      <div className="universal-card-metadata">
        {metadata.memberCount && (
          <span className="metadata-item">
            <i className="bi bi-people me-1"></i>
            {metadata.memberCount}
          </span>
        )}
        {metadata.meetingType && (
          <span className="metadata-item">
            <i className="bi bi-geo-alt me-1"></i>
            {metadata.meetingType}
          </span>
        )}
        {metadata.createdAt && (
          <span className="metadata-item">
            <i className="bi bi-calendar me-1"></i>
            {metadata.createdAt}
          </span>
        )}
      </div>
    );
  };
  
  // 특징 목록 렌더링 (feature 카드용)
  const renderBenefits = () => {
    if (!benefits || benefits.length === 0) return null;
    
    return (
      <div className="universal-card-benefits">
        {benefits.map((benefit, index) => (
          <div key={index} className="benefit-item">
            <div className="benefit-icon">✓</div>
            <span>{benefit}</span>
          </div>
        ))}
      </div>
    );
  };
  
  // 카드 콘텐츠 레이아웃 결정
  const getCardLayout = () => {
    switch (variant) {
      case "feature":
        return (
          <>
            {renderImage()}
            <div className="universal-card-content">
              {renderDescription()}
              {renderBenefits()}
              {children}
            </div>
          </>
        );
      
      case "group":
        return (
          <div className="universal-card-content">
            {renderDescription()}
            {renderTags()}
            {renderBadges()}
            {renderMetadata()}
            {children}
          </div>
        );
      
      case "dashboard":
        return (
          <div className="universal-card-content">
            {renderDescription()}
            {children}
          </div>
        );
      
      default:
        return (
          <div className="universal-card-content">
            {renderDescription()}
            {renderTags()}
            {renderBadges()}
            {renderMetadata()}
            {renderBenefits()}
            {children}
          </div>
        );
    }
  };
  
  return (
    <div 
      className={`${getVariantClasses()} ${className}`}
      style={{ minHeight, cursor: (onClick || href) ? "pointer" : "default" }}
      onClick={handleClick}
      {...props}
    >
      {renderHeader()}
      {getCardLayout()}
    </div>
  );
};

export default UniversalCard;