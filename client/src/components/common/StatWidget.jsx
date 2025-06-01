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
    <div className={`stat-widget-common stat-widget-${size} ${darkMode ? "dark-mode" : ""}`}>
      <div className={`stat-icon-common bg-${color}`}>
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