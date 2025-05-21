import { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { getUserGroups } from "../utils/GroupService";
import LoadingSpinner from "../components/LoadingSpinner";

// 대시보드 컴포넌트들 임포트
import ClockTimerComponent from "../components/dashboard/ClockTimerComponent";
import WelcomeMessageComponent from "../components/dashboard/WelcomeMessageComponent";
import UpcomingEventsComponent from "../components/dashboard/UpcomingEventsComponent";
import GroupRequestsComponent from "../components/dashboard/GroupRequestsComponent";
import MyGroupsComponent from "../components/dashboard/MyGroupsComponent";

const DashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userGroups, setUserGroups] = useState([]);
  const [hasAdminGroups, setHasAdminGroups] = useState(false);
  
  // 사용자 그룹 데이터 가져오기
  const fetchUserGroupsData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setError("");
      console.log("그룹 데이터 로드 시작");
      
      // Firebase에서 그룹 데이터 가져오기
      const groups = await getUserGroups(currentUser.uid);
      
      if (groups && Array.isArray(groups)) {
        console.log(`${groups.length}개 그룹 로드 성공`);
        setUserGroups(groups);
        
        // 관리자 권한이 있는 그룹 확인
        const isAdmin = groups.some(group => {
          // 그룹 생성자 확인
          if (group.createdBy === currentUser.uid) return true;
          
          // 멤버 권한 확인
          return group.members?.some(
            member => member.userId === currentUser.uid && member.role === "admin"
          );
        });
        
        setHasAdminGroups(isAdmin);
      } else {
        console.log("그룹 데이터 없음");
        setUserGroups([]);
      }
    } catch (error) {
      console.error("그룹 데이터 로드 오류:", error);
      setError("데이터를 불러오는 중 오류가 발생했습니다. 새로고침을 시도해보세요.");
      setUserGroups([]);
    }
  }, [currentUser]); // currentUser만 의존성으로 설정
  
  // 사용자 정보 및 그룹 데이터 가져오기
  useEffect(() => {
    // 사용자 인증 정보가 로드되면 데이터 가져오기
    if (currentUser && userProfile) {
      console.log("사용자 인증 확인됨, 데이터 로드 시작");
      setIsLoading(true);
      
      // 비동기 함수 래핑
      const loadData = async () => {
        try {
          await fetchUserGroupsData();
        } catch (err) {
          console.error("데이터 로드 중 오류:", err);
        } finally {
          // 모든 데이터 로드 후 로딩 상태 해제 (지연 적용)
          setTimeout(() => {
            setIsLoading(false);
            console.log("로딩 상태 해제");
          }, 500);
        }
      };
      
      loadData();
    }
  }, [currentUser, userProfile, fetchUserGroupsData]);
  
  // 데이터 새로고침 함수
  const refreshData = useCallback(() => {
    console.log("데이터 새로고침 요청됨");
    fetchUserGroupsData();
  }, [fetchUserGroupsData]);
  
  // 로딩 중이면 로딩 스피너 표시
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // 인증 데이터가 없으면 로딩 스피너 표시
  if (!currentUser || !userProfile) {
    return <LoadingSpinner />;
  }
  
  return (
    <Container fluid className={`dashboard-layout ${darkMode ? "dark-mode" : ""}`}>
      <div className="main-area-full">
        <div className="navbar-spacer"></div>
        
        <main className="dashboard-content">
          {error && (
            <Alert 
              variant="danger" 
              dismissible 
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}
          
          {/* 환영 메시지 섹션 */}
          <WelcomeMessageComponent />
          
          <Row className="mb-4">
            {/* 왼쪽 컬럼 - 시계/타이머 */}
            <Col lg={6} className="mb-4 mb-lg-0">
              <ClockTimerComponent />
            </Col>
            
            {/* 오른쪽 컬럼 - 다가오는 일정 */}
            <Col lg={6}>
              <UpcomingEventsComponent 
                userGroups={userGroups}
                onDataChange={refreshData}
              />
            </Col>
          </Row>
          
          <Row>
            {/* 왼쪽 컬럼 - 내 그룹 */}
            <Col lg={6} className="mb-4 mb-lg-0">
              <MyGroupsComponent 
                userGroups={userGroups}
                onDataChange={refreshData}
              />
            </Col>
            
            {/* 오른쪽 컬럼 - 그룹 가입 요청 */}
            <Col lg={6}>
              {hasAdminGroups && (
                <GroupRequestsComponent 
                  userGroups={userGroups}
                  onDataChange={refreshData}
                />
              )}
            </Col>
          </Row>
        </main>
      </div>
    </Container>
  );
};

export default DashboardPage;