import { Button } from "react-bootstrap";
import { useDarkMode } from "../../contexts/DarkModeContext";

const BottomButtonsComponent = ({ openModal, hasAdminGroups }) => {
  const { darkMode } = useDarkMode();
  
  return (
    <div className={`bottom-buttons-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="bottom-buttons-wrapper">
        {/* 내 그룹 버튼 */}
        <Button
          variant={darkMode ? "light" : "primary"}
          className="bottom-button"
          onClick={() => openModal("myGroups")}
        >
          <i className="bi bi-people-fill"></i>
        </Button>
        
        {/* 다가오는 일정 버튼 */}
        <Button
          variant={darkMode ? "light" : "primary"}
          className="bottom-button"
          onClick={() => openModal("upcomingEvents")}
        >
          <i className="bi bi-calendar-event"></i>
        </Button>
        
        {/* 관리자인 경우에만 그룹 요청 버튼 표시 */}
        {hasAdminGroups && (
          <Button
            variant={darkMode ? "light" : "primary"}
            className="bottom-button"
            onClick={() => openModal("groupRequests")}
          >
            <i className="bi bi-envelope-fill"></i>
          </Button>
        )}
      </div>
    </div>
  );
};

export default BottomButtonsComponent;