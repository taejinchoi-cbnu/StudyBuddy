import { Modal } from "react-bootstrap";
import { useDarkMode } from "../../contexts/DarkModeContext";

// 기존 컴포넌트 임포트
import UpcomingEventsComponent from "./UpcomingEventsComponent";
import GroupRequestsComponent from "./GroupRequestsComponent";
import MyGroupsComponent from "./MyGroupsComponent";

const DashboardModal = ({ 
  show, 
  onHide, 
  activeComponent, 
  userGroups, 
  hasAdminGroups, 
  onDataChange 
}) => {
  const { darkMode } = useDarkMode();
  
  // 모달 제목 결정
  const getModalTitle = () => {
    switch (activeComponent) {
      case "myGroups":
        return "내 스터디 그룹";
      case "upcomingEvents":
        return "다가오는 일정";
      case "groupRequests":
        return "그룹 가입 요청";
      default:
        return "";
    }
  };
  
  // 활성화된 컴포넌트 렌더링
  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "myGroups":
        return (
          <MyGroupsComponent 
            userGroups={userGroups}
            onDataChange={onDataChange}
          />
        );
      case "upcomingEvents":
        return (
          <UpcomingEventsComponent 
            userGroups={userGroups}
            onDataChange={onDataChange}
          />
        );
      case "groupRequests":
        return (
          <GroupRequestsComponent 
            userGroups={userGroups}
            onDataChange={onDataChange}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      className={`dashboard-modal ${darkMode ? "dark-mode" : ""}`}
    >
      <Modal.Header closeButton>
        <Modal.Title>{getModalTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {renderActiveComponent()}
      </Modal.Body>
    </Modal>
  );
};

export default DashboardModal;