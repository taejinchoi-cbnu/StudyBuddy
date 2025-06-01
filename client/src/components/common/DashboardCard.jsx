import { useDarkMode } from '../../contexts/DarkModeContext'

const DashboardCard = ({ 
  title, 
  icon, 
  headerAction, 
  className = "", 
  children,
  minHeight = "280px",
  ...props 
}) => {
  const { darkMode } = useDarkMode();
  
  return (
    <div 
      className={`dashboard-card-common ${className} ${darkMode ? "dark-mode" : ""}`}
      style={{ minHeight }}
      {...props}
    >
      {(title || icon || headerAction) && (
        <div className="card-header-common">
          <div className="card-header-left">
            {icon && <i className={`${icon} me-2`}></i>}
            {title && <h5 className="card-title-common">{title}</h5>}
          </div>
          {headerAction && (
            <div className="card-header-actions">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="card-body-common">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;