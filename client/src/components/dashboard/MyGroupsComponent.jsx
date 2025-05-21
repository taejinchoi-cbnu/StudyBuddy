import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Button, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const MyGroupsComponent = ({ userGroups = [], onDataChange }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  return (
    <Card className={`shadow-sm ${darkMode ? "dark-mode" : ""}`}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">내 스터디 그룹</h4>
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={handleViewAllGroups}
        >
          모든 그룹 보기
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {isProcessing ? (
          <div className="text-center py-3">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
          </div>
        ) : userGroups.length > 0 ? (
          <Row xs={1} md={2} className="g-3">
            {userGroups.map((group) => (
              <Col key={group.id}>
                <Card 
                  className={`h-100 group-card ${darkMode ? "dark-mode" : ""}`}
                  onClick={() => handleGroupClick(group.id)}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body>
                    <Card.Title>{group.name}</Card.Title>
                    <Card.Text className="small text-truncate">
                      {group.description}
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {group.memberCount || 1}/{group.maxMembers} 명
                      </small>
                      <small className="text-muted">
                        {group.meetingType}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center py-3">
            <p>참여 중인 스터디 그룹이 없습니다.</p>
            <Button 
              variant="primary" 
              onClick={handleCreateGroup}
            >
              새 그룹 만들기
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MyGroupsComponent;