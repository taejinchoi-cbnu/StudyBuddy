import { Container, Row, Col, Card } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { getUserGroups } from "../utils/GroupService";
import { getUserEvents } from "../utils/ScheduleService";
import LoadingSpinner from "../components/LoadingSpinner";
import useFirebaseData from "../hooks/useFirebaseData";
import { useCallback } from "react";

// 컴포넌트들 import
import ClockTimerComponent from "../components/dashboard/ClockTimerComponent";
import WelcomeMessageComponent from "../components/dashboard/WelcomeMessageComponent";
import UpcomingEventsComponent from "../components/dashboard/UpcomingEventsComponent";
import GroupRequestsComponent from "../components/dashboard/GroupRequestsComponent";
import GroupRecommendationComponent from "../components/dashboard/GroupRecommendationComponent.jsx";
import MiniCalendarComponent from "../components/dashboard/MiniCalendarComponent";
import MeetingStatsComponent from "../components/dashboard/MeetingStatsComponent";
import TimerCardComponent from "../components/dashboard/TimerCardComponent .jsx";

const DashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();

  // 사용자 그룹 데이터 가져오기
  const fetchUserGroups = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserGroups(currentUser.uid);
  }, [currentUser]);

  // 사용자 일정 데이터 가져오기
  const fetchUserEvents = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserEvents(currentUser.uid);
  }, [currentUser]);

  // useFirebaseData로 그룹 데이터 관리하기
  const {
    data: userGroups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchUserGroups
  } = useFirebaseData(
    fetchUserGroups,
    [currentUser, userProfile],
    {
      enabled: !!currentUser && !!userProfile,
      initialData: [],
      onSuccess: (groupsData) => {
        console.log("사용자 그룹 데이터 로드 성공:", groupsData?.length || 0, "개 그룹");
      }
    }
  );

  // useFirebaseData로 일정 데이터 관리하기
  const {
    data: userEvents,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchUserEvents
  } = useFirebaseData(
    fetchUserEvents,
    [currentUser],
    {
      enabled: !!currentUser,
      initialData: [],
      onSuccess: (eventsData) => {
        console.log("사용자 일정 데이터 로드 성공:", eventsData?.length || 0, "개 일정");
      }
    }
  );

  // 관리자 권한이 있는 그룹 확인
  const hasAdminGroups = userGroups?.some(group => {
    return group.createdBy === currentUser?.uid || 
           group.members?.some(member => 
             member.userId === currentUser?.uid && member.role === "admin"
           );
  }) || false;

  // 데이터 새로고침 함수
  const refreshData = useCallback(() => {
    console.log("데이터 새로고침 요청됨");
    refetchUserGroups();
    refetchUserEvents();
  }, [refetchUserGroups, refetchUserEvents]);

  // 로딩 상태 처리
  if (groupsLoading || eventsLoading) {
    return <LoadingSpinner />;
  }

  // 인증 상태 확인
  if (!currentUser || !userProfile) {
    return <LoadingSpinner />;
  }

  return (
    <Container fluid className={`dashboard-layout ${darkMode ? "dark-mode" : ""}`}>
      <div className="main-area-full">
        <div className="navbar-spacer"></div>
        
        <main className="dashboard-content">
          {/* 에러 메시지 표시 */}
          {(groupsError || eventsError) && (
            <div className="alert alert-danger mt-3" role="alert">
              {groupsError || eventsError}
            </div>
          )}

          {/* 상단: 환영 메시지 */}
          <div className="dashboard-center-content mb-4">
            <WelcomeMessageComponent />
          </div>

          {/* 중앙: 시계 */}
          <div className="dashboard-center-content mb-4">
            <ClockTimerComponent />
          </div>

          {/* 첫 번째 카드 행: 다가오는 일정 + 그룹 요청 + 그룹 추천 */}
          <Container className="dashboard-cards-container">
          <Row className="g-4 mb-4">
            {/* 다가오는 일정 카드 */}
            <Col lg={hasAdminGroups ? 4 : 6} md={6} sm={12}>
              <Card className="dashboard-card h-100">
                <Card.Header>
                  <h5 className="card-title mb-0">
                    <i className="bi bi-calendar-event me-2"></i>
                    다가오는 일정
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <UpcomingEventsComponent 
                    userGroups={userGroups || []}
                    onDataChange={refreshData}
                  />
                </Card.Body>
              </Card>
            </Col>

            {/* 그룹 요청 카드 - 관리자인 경우에만 표시 */}
            {hasAdminGroups && (
              <Col lg={4} md={6} sm={12}>
                <Card className="dashboard-card h-100">
                  <Card.Header>
                    <h5 className="card-title mb-0">
                      <i className="bi bi-envelope-fill me-2"></i>
                      그룹 가입 요청
                    </h5>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <GroupRequestsComponent 
                      userGroups={userGroups || []}
                      onDataChange={refreshData}
                    />
                  </Card.Body>
                </Card>
              </Col>
            )}

            {/* 그룹 추천 카드 */}
            <Col lg={hasAdminGroups ? 4 : 6} md={6} sm={12}>
              <Card className="dashboard-card h-100">
                <Card.Header>
                  <h5 className="card-title mb-0">
                    <i className="bi bi-lightbulb me-2"></i>
                    이런 그룹은 어때요?
                  </h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <GroupRecommendationComponent 
                    userGroups={userGroups || []}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

            {/* 두 번째 카드 행: 미니 캘린더 + 미팅 통계 + 타이머 */}
            <Row className="g-4 mb-4">
              {/* 미니 캘린더 카드 */}
              <Col lg={4} md={6} sm={12}>
                <Card className="dashboard-card h-100">
                  <Card.Header>
                    <h5 className="card-title mb-0">
                      <i className="bi bi-calendar3 me-2"></i>
                      미니 캘린더
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <MiniCalendarComponent 
                      userEvents={userEvents || []}
                    />
                  </Card.Body>
                </Card>
              </Col>

              {/* 미팅 통계 카드 */}
              <Col lg={4} md={6} sm={12}>
                <Card className="dashboard-card h-100">
                  <Card.Header>
                    <h5 className="card-title mb-0">
                      <i className="bi bi-graph-up me-2"></i>
                      미팅 통계
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <MeetingStatsComponent 
                      userGroups={userGroups || []}
                      userEvents={userEvents || []}
                    />
                  </Card.Body>
                </Card>
              </Col>

              {/* 포모도로 타이머 카드 */}
              <Col lg={4} md={12} sm={12}>
                <Card className="dashboard-card h-100">
                  <Card.Header>
                    <h5 className="card-title mb-0">
                      <i className="bi bi-alarm me-2"></i>
                      집중 타이머
                    </h5>
                  </Card.Header>
                  <Card.Body className="d-flex align-items-center justify-content-center">
                    <div className="timer-card-content">
                      <TimerCardComponent/>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </main>
      </div>
    </Container>
  );
};

export default DashboardPage;