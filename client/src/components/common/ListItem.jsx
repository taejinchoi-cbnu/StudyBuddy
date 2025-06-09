import { useDarkMode } from "../../contexts/DarkModeContext";

const ListItem = ({ 
  onClick, 
  title, 
  subtitle, 
  badge, 
  rightContent, 
  className = "",
  variant = "default" // default, upcoming-event, group-request, recommendation
}) => {
  const { darkMode } = useDarkMode();
  
  return (
    <div 
      className={`mb-1 list-item-common list-item-${variant} ${className} ${darkMode ? "dark-mode" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", border: "1px solid var(--accent-color)", borderRadius: "var(--border-radius)" }}    >
      <div className="list-item-content">
        <div className="list-item-info">
          {title && <h6 className="list-item-title">{title}</h6>}
          {subtitle && <div className="list-item-subtitle">{subtitle}</div>}
        </div>
        {(badge || rightContent) && (
          <div className="list-item-right">
            {badge}
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListItem;