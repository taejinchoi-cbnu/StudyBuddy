import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ListGroup, Badge, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const GroupRequestsComponent = ({ userGroups = [], onDataChange }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [adminGroups, setAdminGroups] = useState([]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 관리자인 그룹 및 가입 요청 필터링
  useEffect(() => {
    const filterAdminGroups = () => {
      if (!currentUser || !userGroups || !Array.isArray(userGroups)) return;
      
      try {
        setIsProcessing(true);
        
        // 사용자가 관리자인 그룹 찾기 및 가입 요청이 있는 그룹 필터링
        const adminGroupsWithRequests = [];
        
        for (const group of userGroups) {
          // 멤버 확인하여 현재 사용자가 관리자인지 체크
          const isAdmin = group.members?.some(
            member => member.userId === currentUser.uid && member.role === "admin"
          ) || group.createdBy === currentUser.uid; // 생성자도 관리자로 간주
          
          // 관리자이고 가입 요청이 있는 그룹만 추가
          if (isAdmin && group.joinRequests && group.joinRequests.length > 0) {
            adminGroupsWithRequests.push(group);
          }
        }
        
        setAdminGroups(adminGroupsWithRequests);
      } catch (error) {
        console.error("관리자 그룹 필터링 중 오류:", error);
        setError("그룹 정보를 처리하는 중 문제가 발생했습니다.");
      } finally {
        setIsProcessing(false);
      }
    };
    
    filterAdminGroups();
  }, [currentUser, userGroups]);
  
  // 그룹 페이지로 이동
  const handleGroupClick = useCallback((groupId) => {
    navigate(`/groups/${groupId}`);
  }, [navigate]);
  
  // 요청 개수 계산
  const getTotalRequests = useCallback(() => {
    return adminGroups.reduce((total, group) => {
      return total + (group.joinRequests?.length || 0);
    }, 0);
  }, [adminGroups]);
  
  // 로딩 중인 경우
  if (isProcessing) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </Spinner>
        <p className="mt-3">가입 요청 정보를 처리하는 중...</p>
      </div>
    );
  }
  
  return (
    <div className={`group-requests-component ${darkMode ? "dark-mode" : ""}`}>
      {error && <Alert variant="danger">{error}</Alert>}
      
      {adminGroups.length > 0 ? (
        <>
          <div className="group-requests-header mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <Badge bg="danger" pill className="total-requests-badge">
                총 {getTotalRequests()}개 요청
              </Badge>
            </div>
          </div>
          
          <ListGroup variant="flush" className="group-requests-list">
            {adminGroups.map((group) => (
              <ListGroup.Item 
                key={group.id}
                action
                onClick={() => handleGroupClick(group.id)}
                className={`group-request-item ${darkMode ? "dark-mode" : ""}`}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">{group.name}</h5>
                    <small className="text-muted">
                      처리가 필요한 요청이 있습니다
                    </small>
                  </div>
                  <Badge bg="danger" pill className="request-count-badge">
                    {group.joinRequests?.length || 0}
                  </Badge>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      ) : (
        <div className="text-center py-5 empty-requests">
          <i className="bi bi-envelope-check" style={{ fontSize: "3rem", color: "var(--text-muted)" }}></i>
          <p className="mt-3 text-muted">관리자인 그룹의 가입 요청이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default GroupRequestsComponent;