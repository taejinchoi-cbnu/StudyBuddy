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
import GroupActionModal from "../components/groups/GroupActionModal";
import JoinRequestsList from "../components/groups/JoinRequestsList";
import GroupManagement from "../components/groups/GroupManagement";
import GroupScheduleComponent from "../components/schedule/GroupScheduleComponent";
import logoQuestion from "../assets/logoQuestion.png";

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  // 통합 UI 상태 관리
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
  // 통합 API 관리
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
  // 이벤트 핸들러들
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

      <Row>
        {/* 왼쪽 컬럼: 그룹 정보 및 멤버 목록 */}
        <Col lg={4}>
          <GroupInfo group={group} />
          
          {ui.get("isMember") && (
            <GroupMembersList 
              members={members} 
              currentUser={currentUser}
              className="mt-4"
            />
          )}
        </Col>

        {/* 오른쪽 컬럼: 탭 컨텐츠 */}
        <Col lg={8}>
          <Tabs defaultActiveKey="info" className="mb-4">
            {/* 기본 정보 탭 */}
            <Tab eventKey="info" title="기본 정보">
              <Card className="shadow-sm">
                <Card.Body>
                  <h3 className="mb-4">그룹 소개</h3>
                  <p>{group.description}</p>
                  
                  <div className="mt-4">
                    <h4>주제</h4>
                    <div className="d-flex flex-wrap gap-2">
                      {group.subject?.map((subject) => (
                        <Badge key={subject} bg="primary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4>태그</h4>
                    <div className="d-flex flex-wrap gap-2">
                      {group.tags?.map((tag) => (
                        <Badge key={tag} bg="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            {/* 일정 탭 */}
            {ui.get("isMember") && (
              <Tab eventKey="schedule" title="일정">
                <GroupScheduleComponent 
                  groupId={group.id}
                  currentUser={currentUser}
                />
              </Tab>
            )}

            {/* 관리 탭 */}
            {ui.get("isAdmin") && (
              <Tab eventKey="management" title="그룹 관리">
                <GroupManagement
                  group={group}
                  members={members}
                  currentUser={currentUser}
                  onUpdateSuccess={reloadGroupData}
                  onDeleteSuccess={handleDeleteSuccess}
                  onMemberRemoved={reloadGroupData}
                />
              </Tab>
            )}

            {/* 가입 요청 관리 탭 */}
            {ui.get("isAdmin") && group.joinRequests?.length > 0 && (
              <Tab eventKey="requests" title="가입 요청">
                <JoinRequestsList
                  group={group}
                  currentUser={currentUser}
                  onRequestProcessed={reloadGroupData}
                />
              </Tab>
            )}
          </Tabs>
        </Col>
      </Row>

      {/* 액션 버튼들 */}
      <div className="position-fixed bottom-0 end-0 p-3">
        {!ui.get("isMember") && !ui.get("hasPendingRequest") && (
          <Button
            variant="primary"
            size="lg"
            className="rounded-circle shadow-lg me-2"
            onClick={() => ui.openModal("join")}
          >
            가입하기
          </Button>
        )}
        
        {ui.get("isMember") && !ui.get("isAdmin") && (
          <Button
            variant="danger"
            size="lg"
            className="rounded-circle shadow-lg"
            onClick={() => ui.openModal("leave")}
          >
            탈퇴하기
          </Button>
        )}
      </div>

      {/* 통합 모달 */}
      <GroupActionModal
        show={ui.isModalOpen("join")}
        onHide={() => ui.closeModal("join")}
        type="join"
        group={group}
        onJoinRequest={handleJoinRequest}
      />

      <GroupActionModal
        show={ui.isModalOpen("leave")}
        onHide={() => ui.closeModal("leave")}
        type="leave"
        group={group}
        userId={currentUser.uid}
        onLeaveSuccess={handleLeaveSuccess}
      />
    </Container>
  );
};

export default GroupDetailPage;