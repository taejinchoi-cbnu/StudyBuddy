import { Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCallback } from "react";

// Firebase 데이터 훅 - 기존 패턴 사용
import useFirebaseData from "../hooks/useFirebaseData";
import { getUserGroups } from "../utils/GroupService";
import { getUserEvents } from "../utils/ScheduleService";

// 통합 컴포넌트
import UniversalCard from "../components/common/UniversalCard";

// 기존 컴포넌트들
import ClockTimerComponent from "../components/dashboard/ClockTimerComponent";
import WelcomeMessageComponent from "../components/dashboard/WelcomeMessageComponent";
import UpcomingEventsComponent from "../components/dashboard/UpcomingEventsComponent";
import GroupRequestsComponent from "../components/dashboard/GroupRequestsComponent";
import GroupRecommendationComponent from "../components/dashboard/GroupRecommendationComponent";
import MiniCalendarComponent from "../components/dashboard/MiniCalendarComponent";
import MeetingStatsComponent from "../components/dashboard/MeetingStatsComponent";
import TimerCardComponent from "../components/dashboard/TimerCardComponent";

const DashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();

  // 사용자 그룹 데이터 가져오기 함수
  const fetchUserGroups = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserGroups(currentUser.uid);
  }, [currentUser]);

  // 사용자 일정 데이터 가져오기 함수
  const fetchUserEvents = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserEvents(currentUser.uid);
  }, [currentUser]);

  // useFirebaseData로 그룹 데이터 관리
  const {
    data: userGroups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups
  } = useFirebaseData(
    fetchUserGroups,
    [currentUser],
    {
      enabled: !!currentUser && !!userProfile,
      initialData: [],
      onSuccess: (groupsData) => {
        console.log("사용자 그룹 데이터 로드 성공:", groupsData?.length || 0);
      },
      onError: (error) => {
        console.error("사용자 그룹 데이터 로드 실패:", error);
      }
    }
  );

  // useFirebaseData로 일정 데이터 관리
  const {
    data: userEvents,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useFirebaseData(
    fetchUserEvents,
    [currentUser],
    {
      enabled: !!currentUser,
      initialData: [],
      onSuccess: (eventsData) => {
        console.log("사용자 일정 데이터 로드 성공:", eventsData?.length || 0);
      },
      onError: (error) => {
        console.error("사용자 일정 데이터 로드 실패:", error);
      },
      transform: (eventsData) => {
        if (!Array.isArray(eventsData)) return [];
        
        return eventsData.map(event => ({
          ...event,
          start: event.start?.toDate ? event.start.toDate() : new Date(event.start),
          end: event.end?.toDate ? event.end.toDate() : new Date(event.end),
          isGroupEvent: false
        }));
      }
    }
  );

  // 관리자 권한이 있는 그룹 확인 - 안전한 검사
  const hasAdminGroups = () => {
    if (!Array.isArray(userGroups) || !currentUser) {
      return false;
    }
    
    return userGroups.some(group => {
      return group.createdBy === currentUser.uid || 
             (group.members && Array.isArray(group.members) && 
              group.members.some(member => 
                member.userId === currentUser.uid && member.role === "admin"
              ));
    });
  };

  // 데이터 새로고침 함수
  const refreshData = useCallback(async () => {
    console.log("데이터 새로고침 요청됨");
    try {
      await Promise.all([
        refetchGroups(),
        refetchEvents()
      ]);
    } catch (error) {
      console.error("데이터 새로고침 실패:", error);
    }
  }, [refetchGroups, refetchEvents]);

  // 로딩 상태 처리
  if (groupsLoading || eventsLoading) {
    return <LoadingSpinner />;
  }

  // 인증 상태 확인
  if (!currentUser || !userProfile) {
    return <LoadingSpinner />;
  }

  // 안전한 데이터 확인
  const safeUserGroups = Array.isArray(userGroups) ? userGroups : [];
  const safeUserEvents = Array.isArray(userEvents) ? userEvents : [];
  const showAdminCards = hasAdminGroups();

  return (
    <Container fluid className={`dashboard-layout ${darkMode ? "dark-mode" : ""}`}>
      <div className="main-area-full">
        <div className="navbar-spacer"></div>
        
        <main className="dashboard-content">
          {/* 에러 메시지 표시 */}
          {(groupsError || eventsError) && (
            <div className="alert alert-danger mt-3" role="alert">
              데이터를 불러오는 중 오류가 발생했습니다: {groupsError || eventsError}
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
              <Col lg={showAdminCards ? 4 : 6} md={6} sm={12}>
                <UniversalCard
                  variant="dashboard"
                  title="다가오는 일정"
                  icon="bi-calendar-event"
                  className="h-100"
                >
                  <UpcomingEventsComponent 
                    userGroups={safeUserGroups}
                    onDataChange={refreshData}
                  />
                </UniversalCard>
              </Col>

              {/* 그룹 요청 카드 - 관리자인 경우에만 표시 */}
              {showAdminCards && (
                <Col lg={4} md={6} sm={12}>
                  <UniversalCard
                    variant="dashboard"
                    title="그룹 가입 요청"
                    icon="bi-envelope-fill"
                    className="h-100"
                  >
                    <GroupRequestsComponent 
                      userGroups={safeUserGroups}
                      onDataChange={refreshData}
                    />
                  </UniversalCard>
                </Col>
              )}

              {/* 그룹 추천 카드 */}
              <Col lg={showAdminCards ? 4 : 6} md={6} sm={12}>
                <UniversalCard
                  variant="dashboard"
                  title="이런 그룹은 어때요?"
                  icon="bi-lightbulb"
                  className="h-100"
                >
                  <GroupRecommendationComponent 
                    userGroups={safeUserGroups}
                  />
                </UniversalCard>
              </Col>
            </Row>

            {/* 두 번째 카드 행: 미니 캘린더 + 미팅 통계 + 타이머 */}
            <Row className="g-4 mb-4">
              {/* 미니 캘린더 카드 */}
              <Col lg={4} md={6} sm={12}>
                <UniversalCard
                  variant="dashboard"
                  title="미니 캘린더"
                  icon="bi-calendar3"
                  className="h-100"
                >
                  <MiniCalendarComponent 
                    userEvents={safeUserEvents}
                  />
                </UniversalCard>
              </Col>

              {/* 미팅 통계 카드 */}
              <Col lg={4} md={6} sm={12}>
                <UniversalCard
                  variant="dashboard"
                  title="미팅 통계"
                  icon="bi-graph-up"
                  className="h-100"
                >
                  <MeetingStatsComponent 
                    userGroups={safeUserGroups}
                    userEvents={safeUserEvents}
                  />
                </UniversalCard>
              </Col>

              {/* 타이머 카드 */}
              <Col lg={4} md={12} sm={12}>
                <UniversalCard
                  variant="dashboard"
                  title="집중 타이머"
                  icon="bi-alarm"
                  className="h-100"
                >
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <TimerCardComponent />
                  </div>
                </UniversalCard>
              </Col>
            </Row>
          </Container>
        </main>
      </div>
    </Container>
  );
};

export default DashboardPage;