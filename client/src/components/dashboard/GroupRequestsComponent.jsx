// src/components/dashboard/GroupRequestsComponent.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Alert, Spinner, Button } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const GroupRequestsComponent = ({ userGroups = [], onDataChange }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [adminGroups, setAdminGroups] = useState([]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 관리자인 그룹 및 가입 요청 필터링
  const filterAdminGroups = useCallback(() => {
    if (!currentUser || !userGroups || !Array.isArray(userGroups)) return;
    
    try {
      setIsProcessing(true);
      
      const adminGroupsWithRequests = [];
      
      for (const group of userGroups) {
        const isAdmin = group.members?.some(
          member => member.userId === currentUser.uid && member.role === "admin"
        ) || group.createdBy === currentUser.uid;
        
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
  }, [currentUser, userGroups]);
  
  useEffect(() => {
    filterAdminGroups();
  }, [filterAdminGroups]);
  
  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError("");
    
    try {
      if (onDataChange) {
        await onDataChange();
      }
      
      setTimeout(() => {
        filterAdminGroups();
        setIsRefreshing(false);
      }, 500);
    } catch (error) {
      console.error("새로고침 오류:", error);
      setError("새로고침 중 오류가 발생했습니다.");
      setIsRefreshing(false);
    }
  };
  
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
  
  return (
    <div className={`group-requests-component card-component ${darkMode ? "dark-mode" : ""}`}>
      {/* 카드 헤더 액션 */}
      <div className="card-component-header">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isProcessing}
          className="refresh-btn"
        >
          <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin' : ''}`}></i>
        </Button>
        <div className="header-info">
          {getTotalRequests() > 0 && (
            <Badge bg="danger" pill className="total-requests-badge">
              총 {getTotalRequests()}개 요청
            </Badge>
          )}
        </div>

      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="danger" className="card-alert">
          {error}
        </Alert>
      )}
      
      {/* 컨텐츠 영역 */}
      <div className="card-component-content" style={{ padding: "0.8rem 2rem", borderRadius: "25px" }}>
        {isProcessing ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
            <p className="mt-2 mb-0 small">가입 요청 정보를 처리하는 중...</p>
          </div>
        ) : adminGroups.length > 0 ? (
          <div className="group-requests-list">
            {adminGroups.slice(0, 3).map((group) => (
              <div 
                key={group.id}
                className="group-request-item"
                onClick={() => handleGroupClick(group.id)}
              >
                <div className="request-content">
                  <div className="request-info">
                    <h6 className="group-name">{group.name}</h6>
                    <small className="text-muted">
                      처리가 필요한 요청이 있습니다
                    </small>
                  </div>
                  <Badge bg="danger" pill className="request-count-badge">
                    {group.joinRequests?.length || 0}
                  </Badge>
                </div>
              </div>
            ))}
            
            {adminGroups.length > 3 && (
              <div className="more-requests-info">
                <small className="text-muted">
                  외 {adminGroups.length - 3}개 그룹에 요청 있음
                </small>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-envelope-check" style={{ fontSize: "2rem", color: "var(--text-muted)" }}></i>
            <p className="mt-2 mb-0 small text-muted">관리자인 그룹의 가입 요청이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupRequestsComponent;