import { useState, useCallback } from "react";
import { Container } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { getUserGroups } from "../utils/GroupService";
import LoadingSpinner from "../components/LoadingSpinner";
import useFirebaseData from "../hooks/useFirebaseData";

// 대시보드 컴포넌트들 임포트
import ClockTimerComponent from "../components/dashboard/ClockTimerComponent";
import WelcomeMessageComponent from "../components/dashboard/WelcomeMessageComponent";
import DashboardModal from "../components/dashboard/DashboardModal";
import BottomButtonsComponent from "../components/dashboard/BottomButtonsComponent";

const DashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();

  // 일반 상태 관리
  const [hasAdminGroups, setHasAdminGroups] = useState(false);
  const [error, setError] = useState("");
  
  // 모달 상태 관리
  const [showModal, setShowModal] = useState(false);
  const [activeComponent, setActiveComponent] = useState(""); // 현재 활성화된 컴포넌트
  
  // fetchFunction을 useCallback으로 메모이제이션 (무한 루프 방지)
  const fetchUserGroups = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserGroups(currentUser.uid);
  }, [currentUser]);
  
  // useFirebaseData를 사용하여 사용자 그룹 데이터 가져오기
  const {
    data: userGroups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchUserGroups,
    isSuccess: isGroupsSuccess
  } = useFirebaseData(
    // fetchFunction: 메모이제이션된 함수 사용
    fetchUserGroups,
    // dependencies: currentUser와 userProfile이 변경되면 다시 실행
    [currentUser, userProfile],
    {
      enabled: !!currentUser && !!userProfile, // 인증 완료 후에만 자동 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (groupsData) => {
        console.log("사용자 그룹 데이터 로드 성공:", groupsData?.length || 0, "개 그룹");
        
        // 관리자 권한이 있는 그룹 확인
        if (groupsData && Array.isArray(groupsData)) {
          const isAdmin = groupsData.some(group => {
            // 그룹 생성자 확인
            if (group.createdBy === currentUser.uid) return true;
            
            // 멤버 권한 확인
            return group.members?.some(
              member => member.userId === currentUser.uid && member.role === "admin"
            );
          });
          
          setHasAdminGroups(isAdmin);
          console.log("관리자 권한 그룹 존재:", isAdmin);
        }
        
        // 에러 상태 초기화
        setError("");
      },
      onError: (error) => {
        console.error("사용자 그룹 데이터 로드 실패:", error);
        setError("데이터를 불러오는 중 오류가 발생했습니다. 새로고침을 시도해보세요.");
        setHasAdminGroups(false);
      },
      // 데이터 변환: Firebase 타임스탬프 처리 등
      transform: (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        // 각 그룹의 Firebase 타임스탬프를 Date 객체로 변환
        return data.map(group => {
          if (group.createdAt && typeof group.createdAt.toDate === "function") {
            return {
              ...group,
              createdAt: group.createdAt.toDate()
            };
          }
          return group;
        });
      }
    }
  );
  
  // 모달 열기 함수
  const openModal = useCallback((componentName) => {
    setActiveComponent(componentName);
    setShowModal(true);
  }, []);
  
  // 모달 닫기 함수
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);
  
  // 데이터 새로고침 함수 - useFirebaseData의 refetch 사용
  const refreshData = useCallback(() => {
    console.log("데이터 새로고침 요청됨");
    refetchUserGroups();
  }, [refetchUserGroups]);
  
  // 로딩 중이면 로딩 스피너 표시
  if (groupsLoading) {
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
          {/* 에러 메시지 표시 (useFirebaseData의 에러와 통합) */}
          {(error || groupsError) && (
            <div className="alert alert-danger mt-3" role="alert">
              {error || groupsError}
            </div>
          )}
          
          <div className="dashboard-center-content">
            {/* 환영 메시지 컴포넌트 */}
            <WelcomeMessageComponent />

            {/* 시계 컴포넌트 */}
            <ClockTimerComponent />
          </div>
          
          {/* 하단 버튼 그룹 */}
          <BottomButtonsComponent 
            openModal={openModal} 
            hasAdminGroups={hasAdminGroups}
          />
          
          {/* 대시보드 모달 - userGroups 데이터 전달 */}
          <DashboardModal
            show={showModal}
            onHide={closeModal}
            activeComponent={activeComponent}
            userGroups={userGroups || []} // null 체크 추가
            hasAdminGroups={hasAdminGroups}
            onDataChange={refreshData}
          />
        </main>
      </div>
    </Container>
  );
};

export default DashboardPage;