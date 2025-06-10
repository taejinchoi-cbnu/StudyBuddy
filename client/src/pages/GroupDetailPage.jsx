import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Alert, Nav } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { useState } from "react";
import "../styles/pages/GroupDetail.css";

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
  const [activeKey, setActiveKey] = useState("info");

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
            <img 
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
            <button 
              className="action-btn-primary me-2"
              onClick={() => navigate("/groups")}
            >
              그룹 목록으로 돌아가기
            </button>
            <button 
              className="action-btn-secondary"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
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
    <div className={`main-layout group-detail-page ${darkMode ? "dark-mode" : ""}`}>
      <main className="main-content">
        <div className="group-detail-content">
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

        <div className="group-detail-grid">
          {/* 왼쪽 컬럼 */}
          <div className="group-detail-left-column">
            <div className="group-info-card">
              <GroupInfo group={group} />
            </div>
            <div className="members-list-card">
              <GroupMembersList members={members} />
            </div>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="group-detail-right-column">
            <div className="group-detail-tabs">
              <Nav variant="tabs" activeKey={activeKey} onSelect={setActiveKey} className="mb-2">
                <Nav.Item>
                  <Nav.Link eventKey="info">기본 정보</Nav.Link>
                </Nav.Item>
                {ui.get("isMember") && (
                  <Nav.Item>
                    <Nav.Link eventKey="schedule">일정</Nav.Link>
                  </Nav.Item>
                )}
                {ui.get("isAdmin") && (
                  <>
                    <Nav.Item>
                      <Nav.Link eventKey="management">그룹 관리</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="requests">가입 요청</Nav.Link>
                    </Nav.Item>
                  </>
                )}
              </Nav>

              <div className="tab-content">
                <div className={`tab-pane ${activeKey === "info" ? "active" : ""}`} id="info">
                  <div className="tab-content-area">
                    <div className="tab-pane-content basic-info-tab">
                      <div className="info-section">
                        <h3 className="info-section-title">그룹 소개</h3>
                        <p>{group.description}</p>
                      </div>
                      <div className="info-section">
                        <h3 className="info-section-title">그룹 규칙</h3>
                        <p>{group.rules || "등록된 그룹 규칙이 없습니다."}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {ui.get("isMember") && (
                  <div className={`tab-pane ${activeKey === "schedule" ? "active" : ""}`} id="schedule">
                    <div className="tab-content-area" style={{border: "none", boxShadow: "none !important"}}>
                      <div className="tab-pane-content schedule-tab">
                        <div className="schedule-header">
                          <h3>그룹 일정</h3>
                        </div>
                        <GroupScheduleComponent 
                          group={group} 
                          members={members}
                          currentUser={currentUser}
                          onGroupUpdate={reloadGroupData}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {ui.get("isAdmin") && (
                  <>
                    <div className={`tab-pane ${activeKey === "management" ? "active" : ""}`} id="management">
                      <div className="tab-content-area">
                        <div className="tab-pane-content management-tab">
                          <GroupManagement 
                            group={group} 
                            members={members}
                            currentUser={currentUser}
                            onDeleteSuccess={handleDeleteSuccess}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={`tab-pane ${activeKey === "requests" ? "active" : ""}`} id="requests">
                      <div className="tab-content-area">
                        <div className="tab-pane-content requests-tab">
                          <JoinRequestsList 
                            group={group}
                            currentUser={currentUser}
                            onRequestProcessed={reloadGroupData}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 고정 액션 버튼 */}
        <div className="group-action-buttons">
          {!ui.get("isMember") && !ui.get("hasPendingRequest") && (
            <button 
              className="action-btn-primary"
              onClick={() => ui.openModal("join")}
            >
              가입하기
            </button>
          )}
          {ui.get("isMember") && !ui.get("isAdmin") && (
            <button 
              className="action-btn-secondary"
              onClick={() => ui.openModal("leave")}
            >
              탈퇴하기
            </button>
          )}
        </div>
      </div>

      {/* 모달 컴포넌트들 */}
      <GroupActionModal
        show={ui.get("joinModal")}
        onHide={() => ui.closeModal("join")}
        title="그룹 가입"
        action="join"
        onAction={handleJoinRequest}
        loading={ui.get("joining")}
      />

      <GroupActionModal
        show={ui.get("leaveModal")}
        onHide={() => ui.closeModal("leave")}
        title="그룹 탈퇴"
        action="leave"
        onAction={handleLeaveSuccess}
      />
      </main>
    </div>
  );
};

export default GroupDetailPage;