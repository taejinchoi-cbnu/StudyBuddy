import { Container, Row, Col } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCallback } from "react";

// API 통합 훅
import useApi from "../hooks/useApi";

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

  // 통합 API를 사용한 그룹 데이터 관리
  const groupsApi = useApi("groupMembers", {
    apiType: "firebase",
    firebaseOperation: "list",
    firebaseFilters: [
      { field: "userId", operator: "==", value: currentUser?.uid }
    ],
    executeOnMount: !!currentUser && !!userProfile,
    showNotifications: true,
    cacheDuration: 2 * 60 * 1000, // 2분 캐싱
    onSuccess: (membersData) => {
      console.log("사용자 그룹 멤버십 로드 성공:", membersData?.length || 0);
    },
    transform: async (membersData) => {
      // 멤버십 데이터에서 그룹 정보를 가져오는 로직
      if (!membersData || !Array.isArray(membersData)) return [];
      
      const groupPromises = membersData.map(async (member) => {
        try {
          const groupResponse = await fetch(`/api/groups/${member.groupId}`);
          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            return { ...groupData, memberInfo: member };
          }
        } catch (error) {
          console.error(`그룹 ${member.groupId} 로드 실패:`, error);
        }
        return null;
      });
      
      const groups = await Promise.all(groupPromises);
      return groups.filter(Boolean);
    }
  });

  // 통합 API를 사용한 일정 데이터 관리
  const eventsApi = useApi("userEvents", {
    apiType: "firebase",
    firebaseOperation: "list",
    firebaseFilters: [
      { field: "userId", operator: "==", value: currentUser?.uid }
    ],
    executeOnMount: !!currentUser,
    showNotifications: true,
    cacheDuration: 1 * 60 * 1000, // 1분 캐싱
    onSuccess: (eventsData) => {
      console.log("사용자 일정 데이터 로드 성공:", eventsData?.length || 0);
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
  });

  // 관리자 권한이 있는 그룹 확인
  const hasAdminGroups = groupsApi.data?.some(group => {
    return group.createdBy === currentUser?.uid || 
           group.memberInfo?.role === "admin";
  }) || false;

  // 데이터 새로고침 함수
  const refreshData = useCallback(async () => {
    console.log("데이터 새로고침 요청됨");
    try {
      await Promise.all([
        groupsApi.refresh(),
        eventsApi.refresh()
      ]);
    } catch (error) {
      console.error("데이터 새로고침 실패:", error);
    }
  }, [groupsApi, eventsApi]);

  // 로딩 상태 처리
  if (groupsApi.loading || eventsApi.loading) {
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
          {(groupsApi.error || eventsApi.error) && (
            <div className="alert alert-danger mt-3" role="alert">
              {groupsApi.error || eventsApi.error}
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
                <UniversalCard
                  variant="dashboard"
                  title="다가오는 일정"
                  icon="bi-calendar-event"
                  className="h-100"
                >
                  <UpcomingEventsComponent 
                    userGroups={groupsApi.data || []}
                    onDataChange={refreshData}
                  />
                </UniversalCard>
              </Col>

              {/* 그룹 요청 카드 - 관리자인 경우에만 표시 */}
              {hasAdminGroups && (
                <Col lg={4} md={6} sm={12}>
                  <UniversalCard
                    variant="dashboard"
                    title="그룹 가입 요청"
                    icon="bi-envelope-fill"
                    className="h-100"
                  >
                    <GroupRequestsComponent 
                      userGroups={groupsApi.data || []}
                      onDataChange={refreshData}
                    />
                  </UniversalCard>
                </Col>
              )}

              {/* 그룹 추천 카드 */}
              <Col lg={hasAdminGroups ? 4 : 6} md={6} sm={12}>
                <UniversalCard
                  variant="dashboard"
                  title="이런 그룹은 어때요?"
                  icon="bi-lightbulb"
                  className="h-100"
                >
                  <GroupRecommendationComponent 
                    userGroups={groupsApi.data || []}
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
                    userEvents={eventsApi.data || []}
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
                    userGroups={groupsApi.data || []}
                    userEvents={eventsApi.data || []}
                  />
                </UniversalCard>
              </Col>

              {/* 포모도로 타이머 카드 */}
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