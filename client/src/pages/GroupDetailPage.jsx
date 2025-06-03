import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, Image } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";

// 새로운 통합 훅들
import useUIState from "../hooks/useUIState";
import useApi from "../hooks/useApi";

// 컴포넌트들 import
import GroupInfo from "../components/groups/GroupInfo";
import GroupMembersList from "../components/groups/GroupMembersList";
import JoinRequestModal from "../components/groups/JoinRequestModal";
import JoinRequestsList from "../components/groups/JoinRequestsList";
import LeaveGroupModal from "../components/groups/LeaveGroupModal";
import GroupSettings from "../components/groups/GroupSettings";
import MemberManagement from "../components/groups/MemberManagement";
import GroupScheduleComponent from "../components/schedule/GroupScheduleComponent";
import logoQuestion from "../assets/logoQuestion.png";

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  // 통합 UI 상태 관리 (기존의 여러 훅들을 하나로 통합)
  const ui = useUIState(
    {
      // 모달 상태들
      joinModal: false,
      leaveModal: false,
      
      // 사용자 권한 상태
      isMember: false,
      isAdmin: false,
      hasPendingRequest: false,
      
      // 로딩 상태들
      joining: false,
    },
    {
      persistToLocalStorage: false,
      showNotifications: true,
    }
  );

  // ============================================================================
  // 통합 API 관리 (기존의 useFirebaseData들을 통합)
  // ============================================================================
  
  // 그룹 정보 API
  const groupApi = useApi(`groups/${groupId}`, {
    apiType: "firebase",
    firebaseOperation: "get",
    executeOnMount: !!groupId,
    showNotifications: true,
    cacheDuration: 2 * 60 * 1000, // 2분 캐싱
    onSuccess: (groupData) => {
      console.log("그룹 데이터 로드 성공:", groupData);
      
      // 가입 요청 상태 확인
      if (currentUser && groupData.joinRequests) {
        const hasPending = groupData.joinRequests.some(
          request => request.uid === currentUser.uid
        );
        ui.setValue("hasPendingRequest", hasPending);
      }
    },
    onError: (error) => {
      console.error("그룹 데이터 로드 실패:", error);
      ui.showError("그룹 정보를 불러오는 중 오류가 발생했습니다.");
    },
    transform: (data) => {
      if (!data) return null;
      
      // Firebase 타임스탬프 처리
      if (data.createdAt && typeof data.createdAt.toDate === "function") {
        return { ...data, createdAt: data.createdAt.toDate() };
      }
      return data;
    },
  });

  // 멤버 정보 API
  const membersApi = useApi("groupMembers", {
    apiType: "firebase",
    firebaseOperation: "list",
    firebaseFilters: [{ field: "groupId", operator: "==", value: groupId }],
    executeOnMount: !!groupId && groupApi.isSuccess,
    showNotifications: true,
    cacheDuration: 1 * 60 * 1000, // 1분 캐싱
    onSuccess: (membersData) => {
      console.log("멤버 데이터 로드 성공:", membersData);
      
      // 사용자 권한 확인
      if (currentUser && Array.isArray(membersData)) {
        const userMember = membersData.find(member => member.userId === currentUser.uid);
        
        ui.updateState({
          isMember: !!userMember,
          isAdmin: userMember?.role === "admin",
        });
      }
    },
    onError: (error) => {
      console.error("멤버 데이터 로드 실패:", error);
      ui.showError("멤버 정보를 불러오는 중 오류가 발생했습니다.");
    },
  });

  // ============================================================================
  // 이벤트 핸들러들 (기존 로직 유지하되 새로운 훅 활용)
  // ============================================================================

  // 그룹 데이터 새로고침
  const reloadGroupData = async () => {
    try {
      ui.showInfo("그룹 정보를 새로고침 중입니다...");
      
      // 두 API를 순차적으로 새로고침
      await groupApi.refresh();
      await membersApi.refresh();
      
      ui.showSuccess("그룹 정보가 업데이트되었습니다.");
    } catch (error) {
      console.error("그룹 데이터 새로고침 실패:", error);
      ui.showError("그룹 정보를 새로고침하는 중 오류가 발생했습니다.");
    }
  };

  // 가입 요청 제출
  const handleJoinRequest = async (message) => {
    try {
      ui.setLoading("joining", true);
      ui.clearNotifications();

      // Firebase에 가입 요청 추가
      const joinRequestData = {
        uid: currentUser.uid,
        requestedAt: new Date(),
        message: message || "",
      };

      // 그룹 문서 업데이트 (joinRequests 배열에 추가)
      await groupApi.patch({
        joinRequests: [...(groupApi.data.joinRequests || []), joinRequestData]
      });

      ui.showSuccess("가입 요청이 성공적으로 전송되었습니다.");
      ui.setValue("hasPendingRequest", true);
      ui.closeModal("join");

      // 그룹 데이터 새로고침
      await groupApi.refresh();

    } catch (error) {
      console.error("가입 요청 오류:", error);
      ui.showError("가입 요청 중 오류가 발생했습니다: " + error.message);
    } finally {
      ui.setLoading("joining", false);
    }
  };

  // 그룹 탈퇴 성공 처리
  const handleLeaveSuccess = () => {
    ui.closeModal("leave");
    ui.showSuccess("그룹에서 성공적으로 탈퇴했습니다.");
    navigate("/groups");
  };

  // 그룹 삭제 성공 처리
  const handleDeleteSuccess = () => {
    ui.showSuccess("그룹이 성공적으로 삭제되었습니다.");
    navigate("/groups");
  };

  // ============================================================================
  // 렌더링 조건 확인
  // ============================================================================

  // 로딩 중일 때
  if (groupApi.loading || membersApi.loading) {
    return (
      <Container className="text-center py-5">
        <LoadingSpinner />
        <p className="mt-3">그룹 정보를 불러오는 중...</p>
      </Container>
    );
  }

  // 데이터 로드 실패 시 오류 메시지
  if (groupApi.error || !groupApi.data) {
    return (
      <Container className="mt-5">
        <Card className="shadow-sm text-center p-4">
          <Card.Body>
            <Image 
              src={logoQuestion} 
              alt="오류" 
              style={{ width: "150px", height: "auto", margin: "0 auto 2rem" }}
              className="d-block"
            />
            <h3 className="mb-3">그룹 정보를 불러오지 못했습니다</h3>
            <p className="text-muted mb-4">
              요청하신 그룹을 찾을 수 없거나 데이터를 불러오는 도중 문제가 발생했습니다.
              <br />잠시 후 다시 시도해 주세요.
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate("/groups")}
              className="me-2"
            >
              그룹 목록으로 돌아가기
            </Button>
            <Button 
              variant="outline-secondary"
              onClick={() => window.location.reload()}
            >
              새로고침
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // ============================================================================
  // 메인 렌더링
  // ============================================================================

  const group = groupApi.data;
  const members = membersApi.data || [];

  return (
    <Container className={`mt-4 ${darkMode ? "dark-mode" : ""}`}>
      {/* 통합된 알림 메시지 표시 */}
      {groupApi.error && (
        <Alert variant="danger" onClose={() => groupApi.clearNotifications()} dismissible>
          {groupApi.error}
        </Alert>
      )}
      {groupApi.success && (
        <Alert variant="success" onClose={() => groupApi.clearNotifications()} dismissible>
          {groupApi.success}
        </Alert>
      )}
      {ui.get("error") && (
        <Alert variant="danger" onClose={() => ui.clearNotifications()} dismissible>
          {ui.get("error")}
        </Alert>
      )}
      {ui.get("success") && (
        <Alert variant="success" onClose={() => ui.clearNotifications()} dismissible>
          {ui.get("success")}
        </Alert>
      )}
      {ui.get("info") && (
        <Alert variant="info" onClose={() => ui.clearNotifications()} dismissible>
          {ui.get("info")}
        </Alert>
      )}
      
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate("/groups")}
          className="mb-3"
        >
          ← 그룹 목록으로
        </Button>
        
        <Card className="shadow-sm">
          <Card.Body>
            <Row>
              <Col md={8}>
                <h1>{group.name}</h1>
                
                <div className="mb-3">
                  {group.subject && Array.isArray(group.subject) && group.subject.map(subject => (
                    <Badge 
                      key={subject} 
                      bg="primary" 
                      className="me-1 mb-1 p-2"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
                
                <div className="mb-3">
                  {group.tags && Array.isArray(group.tags) && group.tags.map(tag => (
                    <Badge 
                      key={tag} 
                      bg="secondary" 
                      className="me-1 mb-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-muted">
                  미팅 방식: {group.meetingType} | 
                  인원: {group.memberCount || 1}/{group.maxMembers} |
                  생성일: {group.createdAt ? (
                    typeof group.createdAt.toLocaleDateString === "function" 
                      ? group.createdAt.toLocaleDateString() 
                      : new Date(group.createdAt).toLocaleDateString()
                  ) : "날짜 정보 없음"}
                </p>
              </Col>
              
              <Col md={4} className="d-flex align-items-center justify-content-end">
                {/* 가입 상태에 따른 버튼 표시 */}
                {!ui.get("isMember") && !ui.get("hasPendingRequest") && (
                  <Button 
                    variant="primary" 
                    onClick={() => ui.openModal("join")}
                    disabled={ui.isLoading("joining")}
                    className="w-100"
                  >
                    {ui.isLoading("joining") ? "처리 중..." : "가입 요청하기"}
                  </Button>
                )}
                
                {ui.get("hasPendingRequest") && (
                  <Button 
                    variant="outline-primary" 
                    disabled
                    className="w-100"
                  >
                    가입 요청 대기 중
                  </Button>
                )}
                
                {ui.get("isMember") && (
                  <div className="text-center w-100">
                    <Badge bg="success" className="p-2 mb-2">그룹 멤버</Badge>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="w-100"
                      onClick={() => ui.openModal("leave")}
                    >
                      그룹 탈퇴
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
      
      {/* 탭 메뉴 */}
      <Tabs defaultActiveKey="info" className="mb-4">
        <Tab eventKey="info" title="그룹 정보">
          <GroupInfo group={group} isAdmin={ui.get("isAdmin")} />
        </Tab>
        
        <Tab eventKey="members" title="멤버">
          <GroupMembersList 
            members={members} 
            isAdmin={ui.get("isAdmin")}
            currentUser={currentUser} 
          />
        </Tab>

        <Tab eventKey="schedule" title="스케줄">
          <GroupScheduleComponent 
            group={group} 
            members={members}
          />
        </Tab>
        
        {/* 관리자 전용 탭들 */}
        {ui.get("isAdmin") && (
          <Tab eventKey="settings" title="설정">
            <Row className="mt-3">
              <Col lg={6} className="mb-4">
                <GroupSettings 
                  group={group} 
                  currentUser={currentUser} 
                  onUpdateSuccess={reloadGroupData}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              </Col>
              <Col lg={6}>
                <MemberManagement 
                  group={group} 
                  members={members} 
                  currentUser={currentUser}
                  onMemberRemoved={reloadGroupData}
                />
              </Col>
            </Row>
          </Tab>
        )}
        
        {ui.get("isAdmin") && group.joinRequests && group.joinRequests.length > 0 && (
          <Tab eventKey="requests" title={`가입 요청 (${group.joinRequests.length})`}>
            <JoinRequestsList 
              group={group} 
              currentUser={currentUser}
              onRequestProcessed={reloadGroupData}
            />
          </Tab>
        )}
      </Tabs>
      
      {/* 모달들 */}
      <JoinRequestModal 
        show={ui.isModalOpen("join")} 
        onHide={() => ui.closeModal("join")} 
        onSubmit={handleJoinRequest}
        group={group}
      />
      
      {group && currentUser && (
        <LeaveGroupModal
          show={ui.isModalOpen("leave")}
          onHide={() => ui.closeModal("leave")}
          group={group}
          userId={currentUser.uid}
          onLeaveSuccess={handleLeaveSuccess}
        />
      )}
    </Container>
  );
};

export default GroupDetailPage;