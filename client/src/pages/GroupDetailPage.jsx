import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, Image } from "react-bootstrap";
import { getGroupById, getGroupMembers, sendJoinRequest } from "../utils/GroupService";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import useLoading from "../hooks/useLoading";
import useNotification from "../hooks/useNotification";
import useModal from "../hooks/useModal";
import useFirebaseData from "../hooks/useFirebaseData"; 
import logoQuestion from "../assets/logoQuestion.png";

// 컴포넌트들 import
import GroupInfo from "../components/groups/GroupInfo";
import GroupMembersList from "../components/groups/GroupMembersList";
import JoinRequestModal from "../components/groups/JoinRequestModal";
import JoinRequestsList from "../components/groups/JoinRequestsList";
import LeaveGroupModal from "../components/groups/LeaveGroupModal";
import GroupSettings from "../components/groups/GroupSettings";
import MemberManagement from "../components/groups/MemberManagement";
import GroupScheduleComponent from "../components/schedule/GroupScheduleComponent";

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // 알림 및 모달 훅 사용
  const { 
    error, 
    success, 
    showError, 
    showSuccess, 
    clearAll 
  } = useNotification();
  
  const {
    openModal,
    closeModal,
    isOpen,
  } = useModal(["join", "leave"]);
  
  // 일반 상태 관리
  const [isJoining, startJoiningLoading] = useLoading();
  const [userStatus, setUserStatus] = useState({
    isMember: false,
    isAdmin: false,
    hasPendingRequest: false
  });
  
  // useFirebaseData를 사용하여 그룹 정보 가져오기
  const {
    data: group,
    loading: groupLoading,
    error: groupError,
    refetch: refetchGroup,
    isSuccess: isGroupSuccess
  } = useFirebaseData(
    // fetchFunction: groupId가 있을 때만 실행
    groupId ? () => getGroupById(groupId) : null,
    // dependencies: groupId가 변경되면 다시 실행  
    [groupId],
    {
      enabled: !!groupId, // groupId가 있을 때만 자동 실행
      onSuccess: (groupData) => {
        console.log("그룹 데이터 로드 성공:", groupData);
      },
      onError: (error) => {
        console.error("그룹 데이터 로드 실패:", error);
        showError("그룹 정보를 불러오는 중 오류가 발생했습니다.");
      },
      // 그룹 데이터 변환: Firebase 타임스탬프 처리 등
      transform: (data) => {
        if (!data) return null;
        
        // createdAt 필드가 Firebase 타임스탬프인 경우 처리
        if (data.createdAt && typeof data.createdAt.toDate === "function") {
          return {
            ...data,
            createdAt: data.createdAt.toDate()
          };
        }
        
        return data;
      }
    }
  );
  
  // useFirebaseData를 사용하여 멤버 정보 가져오기
  const {
    data: members,
    loading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
    isSuccess: isMembersSuccess
  } = useFirebaseData(
    // fetchFunction: groupId와 그룹 데이터가 있을 때만 실행
    groupId && isGroupSuccess ? () => getGroupMembers(groupId) : null,
    // dependencies: groupId와 그룹 성공 상태가 변경되면 다시 실행
    [groupId, isGroupSuccess],
    {
      enabled: !!groupId && isGroupSuccess, // 그룹 로드 성공 후에만 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (membersData) => {
        console.log("멤버 데이터 로드 성공:", membersData);
        
        // 사용자 상태 업데이트 로직
        if (currentUser && Array.isArray(membersData)) {
          const isMember = membersData.some(member => member.userId === currentUser.uid);
          const isAdmin = membersData.some(
            member => member.userId === currentUser.uid && member.role === "admin"
          );
          
          // 가입 요청 확인
          const hasPendingRequest = group && group.joinRequests && 
            group.joinRequests.some(request => request.uid === currentUser.uid);
          
          setUserStatus({ isMember, isAdmin, hasPendingRequest });
        }
      },
      onError: (error) => {
        console.error("멤버 데이터 로드 실패:", error);
        showError("멤버 정보를 불러오는 중 오류가 발생했습니다.");
      }
    }
  );
  
  // 로딩 상태 통합 관리
  const isLoading = groupLoading || membersLoading;
  const hasError = groupError || membersError;
  
  // 그룹 데이터 새로고침 함수 - 두 데이터를 모두 리패치
  const reloadGroupData = useCallback(async () => {
    try {
      console.log("그룹 데이터 새로고침 시작");
      
      // 순차적으로 데이터 새로고침
      await refetchGroup();
      await refetchMembers();
      
      showSuccess("그룹 정보가 업데이트되었습니다.");
    } catch (error) {
      console.error("그룹 데이터 새로고침 실패:", error);
      showError("그룹 정보를 새로고침하는 중 오류가 발생했습니다.");
    }
  }, [refetchGroup, refetchMembers, showSuccess, showError]);
  
  // 모달 핸들러들
  const toggleJoinModal = () => {
    if (isOpen("join")) {
      closeModal("join");
    } else {
      openModal("join");
    }
  };
  
  const toggleLeaveModal = () => {
    if (isOpen("leave")) {
      closeModal("leave");
    } else {
      openModal("leave");
    }
  };
  
  // 그룹 탈퇴 성공 처리
  const handleLeaveSuccess = () => {
    closeModal("leave");
    showSuccess("그룹에서 성공적으로 탈퇴했습니다.");
    navigate("/groups");
  };
  
  // 그룹 삭제 성공 처리
  const handleDeleteSuccess = () => {
    showSuccess("그룹이 성공적으로 삭제되었습니다.");
    navigate("/groups");
  };
  
  // 가입 요청 제출
  const handleJoinRequest = async (message) => {
    try {
      await startJoiningLoading(sendJoinRequest(groupId, currentUser.uid, message));
      showSuccess("가입 요청이 성공적으로 전송되었습니다.");
      setUserStatus({ ...userStatus, hasPendingRequest: true });
      closeModal("join");
    } catch (error) {
      console.error("Error sending join request:", error);
      showError("가입 요청 중 오류가 발생했습니다: " + error.message);
    }
  };
  
  // 모달 닫기 핸들러들
  const handleJoinModalClose = () => closeModal("join");
  const handleLeaveModalClose = () => closeModal("leave");
  
  // 로딩 중일 때
  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <LoadingSpinner />
        <p className="mt-3">그룹 정보를 불러오는 중...</p>
      </Container>
    );
  }
  
  // 데이터 로드 실패 시 친절한 오류 메시지
  if (hasError || (!group && !isLoading)) {
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
  
  return (
    <Container className={`mt-4 ${darkMode ? "dark-mode" : ""}`}>
      {/* 통합된 알림 메시지 표시 */}
      {error && <Alert variant="danger" onClose={() => clearAll()} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => clearAll()} dismissible>{success}</Alert>}
      
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
                {!userStatus.isMember && !userStatus.hasPendingRequest && (
                  <Button 
                    variant="primary" 
                    onClick={toggleJoinModal}
                    disabled={isJoining}
                    className="w-100"
                  >
                    {isJoining ? "처리 중..." : "가입 요청하기"}
                  </Button>
                )}
                
                {userStatus.hasPendingRequest && (
                  <Button 
                    variant="outline-primary" 
                    disabled
                    className="w-100"
                  >
                    가입 요청 대기 중
                  </Button>
                )}
                
                {userStatus.isMember && (
                  <div className="text-center w-100">
                    <Badge bg="success" className="p-2 mb-2">그룹 멤버</Badge>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="w-100"
                      onClick={toggleLeaveModal}
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
      
      <Tabs defaultActiveKey="info" className="mb-4">
        <Tab eventKey="info" title="그룹 정보">
          <GroupInfo group={group} isAdmin={userStatus.isAdmin} />
        </Tab>
        
        <Tab eventKey="members" title="멤버">
          <GroupMembersList 
            members={members} 
            isAdmin={userStatus.isAdmin}
            currentUser={currentUser} 
          />
        </Tab>

        <Tab eventKey="schedule" title="스케줄">
          <GroupScheduleComponent 
              group={group} 
              members={members}
          />
        </Tab>
        
        {userStatus.isAdmin && (
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
        
        {userStatus.isAdmin && group.joinRequests && group.joinRequests.length > 0 && (
          <Tab eventKey="requests" title={`가입 요청 (${group.joinRequests.length})`}>
            <JoinRequestsList 
              group={group} 
              currentUser={currentUser}
              onRequestProcessed={reloadGroupData}
            />
          </Tab>
        )}
      </Tabs>
      
      {/* 가입 요청 모달 */}
      <JoinRequestModal 
        show={isOpen("join")} 
        onHide={handleJoinModalClose} 
        onSubmit={handleJoinRequest}
        group={group}
      />
      
      {/* 그룹 탈퇴 모달 */}
      {group && currentUser && (
        <LeaveGroupModal
          show={isOpen("leave")}
          onHide={handleLeaveModalClose}
          group={group}
          userId={currentUser.uid}
          onLeaveSuccess={handleLeaveSuccess}
        />
      )}
    </Container>
  );
};

export default GroupDetailPage;