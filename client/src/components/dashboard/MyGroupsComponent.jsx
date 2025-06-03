import { useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import UniversalCard from "../common/UniversalCard";

// 그룹 카드 메모이제이션 - 불필요한 리렌더링 방지
const GroupCard = memo(({ group, onClick }) => {
  const { darkMode } = useDarkMode();
  
  // 그룹 메타데이터 구성
  const metadata = {
    memberCount: `${group.memberCount || 1}/${group.maxMembers}`,
    meetingType: group.meetingType,
    createdAt: group.createdAt ? new Date(group.createdAt).toLocaleDateString() : ""
  };

  // 그룹 태그 구성
  const tags = group.tags ? group.tags.slice(0, 3) : [];
  
  // 참여중 배지
  const badges = [{ text: "참여중", variant: "success" }];
  
  return (
    <UniversalCard
      variant="group"
      title={group.name}
      description={group.description}
      tags={tags}
      badges={badges}
      metadata={metadata}
      onClick={onClick}
      className={`h-100 hover-lift ${darkMode ? "dark-mode" : ""}`}
    />
  );
});

GroupCard.displayName = "GroupCard";

const MyGroupsComponent = memo(({ userGroups = [], onDataChange }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // 그룹 페이지로 이동 - useCallback으로 메모이제이션
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
          {/* 헤더 영역 */}
          <div className="my-groups-header d-flex justify-content-between align-items-center mb-3">
            <div></div>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleViewAllGroups}
              className="view-all-btn"
            >
              <i className="bi bi-list me-1"></i>
              모든 그룹 보기
            </Button>
          </div>
          
          {/* 그룹 그리드 */}
          <Row xs={1} md={2} className="g-3 my-groups-grid">
            {userGroups.map((group) => (
              <Col key={group.id}>
                <GroupCard 
                  group={group}
                  onClick={() => handleGroupClick(group.id)}
                />
              </Col>
            ))}
          </Row>
          
          {/* 새 그룹 만들기 버튼 */}
          <div className="text-center mt-4">
            <Button 
              variant="primary" 
              onClick={handleCreateGroup}
              className="create-group-btn"
            >
              <i className="bi bi-plus-circle me-2"></i>
              새 그룹 만들기
            </Button>
          </div>
        </>
      ) : (
        /* 빈 상태 */
        <div className="text-center py-5 empty-groups">
          <i 
            className="bi bi-people" 
            style={{ fontSize: "3rem", color: "var(--text-muted)" }}
          ></i>
          <p className="mt-3 text-muted">참여 중인 스터디 그룹이 없습니다.</p>
          <Button 
            variant="primary" 
            onClick={handleCreateGroup}
            className="mt-2"
          >
            <i className="bi bi-plus-circle me-2"></i>
            새 그룹 만들기
          </Button>
        </div>
      )}
    </div>
  );
});

MyGroupsComponent.displayName = "MyGroupsComponent";

export default MyGroupsComponent;