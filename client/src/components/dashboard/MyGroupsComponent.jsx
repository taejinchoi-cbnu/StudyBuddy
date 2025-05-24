import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Button, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const MyGroupsComponent = ({ userGroups = [], onDataChange }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // 그룹 페이지로 이동
  const handleGroupClick = useCallback((groupId) => {
    navigate(`/groups/${groupId}`);
  }, [navigate]);
  
  // 그룹 생성 페이지로 이동
  const handleCreateGroup = useCallback(() => {
    navigate("/groups/create");
  }, [navigate]);
  
  // 그룹 목록 페이지로 이동
  const handleViewAllGroups = useCallback(() => {
    navigate("/groups");
  }, [navigate]);
  
  // 로딩 중이거나 사용자 정보가 없는 경우
  if (!currentUser) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <div className={`my-groups-component ${darkMode ? "dark-mode" : ""}`}>
      {userGroups.length > 0 ? (
        <>
          <div className="my-groups-header d-flex justify-content-between align-items-center mb-3">
            <div></div>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleViewAllGroups}
              className="view-all-btn"
            >
              <i className="bi bi-list"></i> 모든 그룹 보기
            </Button>
          </div>
          
          <Row xs={1} md={2} className="g-3 my-groups-grid">
            {userGroups.map((group) => (
              <Col key={group.id}>
                <Card 
                  className={`h-100 group-card ${darkMode ? "dark-mode" : ""}`}
                  onClick={() => handleGroupClick(group.id)}
                >
                  <Card.Body>
                    <Card.Title className="group-card-title">{group.name}</Card.Title>
                    <Card.Text className="group-card-description text-truncate">
                      {group.description}
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <small className="text-muted">
                        <i className="bi bi-people"></i> {group.memberCount || 1}/{group.maxMembers}
                      </small>
                      <small className="text-muted">
                        <i className="bi bi-geo-alt"></i> {group.meetingType}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          <div className="text-center mt-4">
            <Button 
              variant="primary" 
              onClick={handleCreateGroup}
              className="create-group-btn"
            >
              <i className="bi bi-plus-circle"></i> 새 그룹 만들기
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-5 empty-groups">
          <i className="bi bi-people" style={{ fontSize: "3rem", color: "var(--text-muted)" }}></i>
          <p className="mt-3 text-muted">참여 중인 스터디 그룹이 없습니다.</p>
          <Button 
            variant="primary" 
            onClick={handleCreateGroup}
            className="mt-2"
          >
            <i className="bi bi-plus-circle"></i> 새 그룹 만들기
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyGroupsComponent;