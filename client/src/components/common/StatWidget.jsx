import { useDarkMode } from "../../contexts/DarkModeContext";

const StatWidget = ({ 
  icon, 
  value, 
  label, 
  color = "primary",
  size = "default" // compact, default
}) => {
  const { darkMode } = useDarkMode();
  
  return (
    <div className={`stat-widget-common stat-widget-${size} ${darkMode ? "dark-mode" : ""}`} style={{marginTop: "1rem", border: "1px solid var(--accent-color)", padding: "1rem"}}>
      <div className={`stat-icon-common`}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="stat-content-common">
        <div className="stat-value-common">{value}</div>
        <div className="stat-label-common">{label}</div>
      </div>
    </div>
  );
};

export default StatWidget;