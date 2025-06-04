import { Container, Row, Col, Button, Badge, Form } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCallback, useState, useEffect } from "react";

// Firebase 데이터 훅 - 기존 패턴 사용
import useFirebaseData from "../hooks/useFirebaseData";
import { getUserGroups } from "../utils/GroupService";
import { getUserEvents } from "../utils/ScheduleService";

// 통합 컴포넌트
import UniversalCard from "../components/common/UniversalCard";
import StatWidget from "../components/common/StatWidget";

// 기존 컴포넌트들
import UpcomingEventsComponent from "../components/dashboard/UpcomingEventsComponent";
import GroupRequestsComponent from "../components/dashboard/GroupRequestsComponent";
import GroupRecommendationComponent from "../components/dashboard/GroupRecommendationComponent";

const DashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();

  // 시계 관련 상태
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState("");

  // 미니 캘린더 관련 상태
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  // 미팅 통계 관련 상태
  const [stats, setStats] = useState({
    totalGroups: 0,
    upcomingMeetings: 0,
    thisWeekMeetings: 0,
    completedMeetings: 0
  });

  // 타이머 관련 상태
  const [timerMode, setTimerMode] = useState("work");
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [sessions, setSessions] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(20);

  // 시간 업데이트 (시계 전용)
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timerId);
    };
  }, []);

  // 시간대별 인사말 설정
  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // 시간대별 메시지 설정
      let newTimeOfDay = "";
      if (hour >= 6 && hour < 9) {
        newTimeOfDay = "좋은 아침입니다";
      } else if (hour >= 9 && hour < 12) {
        newTimeOfDay = "좋은 오전입니다.";
      } else if (hour >= 12 && hour < 18) {
        newTimeOfDay = "좋은 오후입니다";
      } else if (hour >= 18 && hour < 22) {
        newTimeOfDay = "좋은 저녁입니다.";
      } else if (hour >= 22 || hour < 1) {
        newTimeOfDay = "좋은 밤입니다.";
      } else {
        newTimeOfDay = "좋은 새벽입니다.";
      }
      
      setTimeOfDay(newTimeOfDay);
    };
    
    // 초기 실행 및 1분마다 업데이트
    updateGreeting();
    const intervalId = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // 시간 형식 변환 (시:분:초)
  const formatTime = useCallback((date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, []);

  // 날짜 형식 변환
  const formatDate = useCallback((date) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('ko-KR', options);
  }, []);

  // 사용자 이름 가져오기
  const displayName = userProfile?.displayName || currentUser?.email?.split("@")[0] || "사용자";

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

  // 미니 캘린더 날짜 계산
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 이번 달 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫째 주 시작일 (일요일부터)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // 3x3 = 9일만 표시 (중앙 주간)
    const days = [];
    const centerWeekStart = new Date(currentDate);
    centerWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 9; i++) {
      const day = new Date(centerWeekStart);
      day.setDate(centerWeekStart.getDate() + i);
      
      // 해당 날짜에 이벤트가 있는지 확인
      const hasEvent = userEvents.some(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === day.toDateString();
      });
      
      days.push({
        date: day,
        day: day.getDate(),
        isToday: day.toDateString() === new Date().toDateString(),
        isCurrentMonth: day.getMonth() === month,
        hasEvent
      });
    }
    
    setCalendarDays(days);
  }, [currentDate, userEvents]);

  // 미팅 통계 계산
  useEffect(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // 이번 주 미팅 계산
    const thisWeekEvents = userEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    // 예정된 미팅 계산
    const upcomingEvents = userEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate > now;
    });

    // 완료된 미팅 계산 (지난 30일)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const completedEvents = userEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= thirtyDaysAgo && eventDate < now;
    });

    setStats({
      totalGroups: userGroups.length,
      upcomingMeetings: upcomingEvents.length,
      thisWeekMeetings: thisWeekEvents.length,
      completedMeetings: completedEvents.length
    });
  }, [userGroups, userEvents]);

  // 타이머 실행
  useEffect(() => {
    let timerId;
    
    if (timerRunning && secondsLeft > 0) {
      timerId = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            setSessions(prevSessions => prevSessions + 1);
            
            if (Notification.permission === "granted") {
              new Notification("⏰ 시간이 완료되었습니다!", {
                icon: "/favicon.ico",
                badge: "/favicon.ico"
              });
            }
            
            return inputMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [timerRunning, secondsLeft, inputMinutes]);

  // 알림 권한 요청
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 타이머 시간 형식 변환 (분:초)
  const formatTimerTime = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, []);

  // 타이머 시작/정지 핸들러
  const toggleTimer = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    setTimerRunning(prev => !prev);
  };

  // 타이머 리셋 핸들러
  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsLeft(inputMinutes * 60);
  };

  // 시간 클릭 시 편집 모드
  const handleTimeClick = () => {
    if (!timerRunning) {
      setIsEditing(true);
      setInputMinutes(Math.floor(secondsLeft / 60));
    }
  };

  // 시간 입력 완료
  const handleTimeSubmit = (e) => {
    e.preventDefault();
    const minutes = Math.max(1, Math.min(99, parseInt(inputMinutes) || 20));
    setInputMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setIsEditing(false);
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTimeSubmit(e);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputMinutes(Math.floor(secondsLeft / 60));
    }
  };

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
            <div className={`welcome-message-component ${darkMode ? "dark-mode" : ""}`}>
              <h3 className="welcome-message">
                안녕하세요, <span className="user-name">{displayName}</span>님 {timeOfDay}
              </h3>
            </div>
          </div>

          {/* 중앙: 시계 */}
          <div className="dashboard-center-content mb-4">
            <div className={`clock-component ${darkMode ? "dark-mode" : ""}`}>
              <div className="clock-container">
                <div className="clock-display">
                  <h1 className="clock-time">{formatTime(currentTime)}</h1>
                  <p className="clock-date">{formatDate(currentTime)}</p>
                </div>
              </div>
            </div>
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
                  <div className={`mini-calendar-component ${darkMode ? "dark-mode" : ""}`}>
                    <div className="calendar-header">
                      <h6 className="month-year">
                        {currentDate.toLocaleDateString('ko-KR', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </h6>
                    </div>
                    
                    <div className="calendar-grid">
                      {calendarDays.map((day, index) => (
                        <div 
                          key={index}
                          className={`calendar-day ${day.isToday ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''}`}
                        >
                          <span className="day-number">{day.day}</span>
                          {day.hasEvent && <div className="event-dot"></div>}
                        </div>
                      ))}
                    </div>
                  </div>
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
                  <div className={`meeting-stats-component ${darkMode ? "dark-mode" : ""}`}>
                    <div className="stats-grid">
                      <StatWidget 
                        icon="bi-people-fill" 
                        label="참여 그룹" 
                        value={stats.totalGroups}
                        color="info"
                        size="compact"
                      />
                      <StatWidget 
                        icon="bi-calendar-event" 
                        label="예정 미팅" 
                        value={stats.upcomingMeetings}
                        color="warning"
                        size="compact"
                      />
                      <StatWidget 
                        icon="bi-calendar-week" 
                        label="이번 주" 
                        value={stats.thisWeekMeetings}
                        color="success"
                        size="compact"
                      />
                      <StatWidget 
                        icon="bi-check-circle" 
                        label="완료 미팅" 
                        value={stats.completedMeetings}
                        color="secondary"
                        size="compact"
                      />
                    </div>
                  </div>
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
                    <div className={`timer-card-component ${darkMode ? "dark-mode" : ""}`}>
                      {/* 세션 카운터 */}
                      {sessions > 0 && (
                        <div className="sessions-display">
                          <Badge bg="success" pill className="sessions-badge">
                            완료: {sessions}세션
                          </Badge>
                        </div>
                      )}

                      {/* 타이머 메인 영역 */}
                      <div className="timer-card-content">
                        {/* 타이머 디스플레이 */}
                        <div className="timer-display-section" onClick={handleTimeClick}>
                          {isEditing ? (
                            <Form onSubmit={handleTimeSubmit} className="time-input-form">
                              <Form.Control
                                type="number"
                                min="1"
                                max="99"
                                value={inputMinutes}
                                onChange={(e) => setInputMinutes(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onBlur={handleTimeSubmit}
                                className="time-input"
                                autoFocus
                              />
                              <small className="time-input-hint">분</small>
                            </Form>
                          ) : (
                            <>
                              <h2 className="timer-display">
                                {formatTimerTime(secondsLeft)}
                              </h2>
                              {!timerRunning && (
                                <small className="edit-hint">클릭하여 시간 설정</small>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* 진행률 바 */}
                        {timerRunning && (
                          <div className="timer-progress">
                            <div 
                              className="timer-progress-bar"
                              style={{
                                width: `${((inputMinutes * 60) - secondsLeft) / (inputMinutes * 60) * 100}%`
                              }}
                            ></div>
                          </div>
                        )}
                        
                        {/* 타이머 컨트롤 */}
                        <div className="timer-controls-section">
                          <Button 
                            variant={timerRunning ? "warning" : "primary"} 
                            onClick={toggleTimer}
                            className="timer-control-btn"
                            size="sm"
                          >
                            {timerRunning ? (
                              <><i className="bi bi-pause-fill"></i> 일시정지</>
                            ) : (
                              <><i className="bi bi-play-fill"></i> 시작</>
                            )}
                          </Button>
                          
                          {(timerRunning || secondsLeft !== inputMinutes * 60) && (
                            <Button 
                              variant="outline-secondary" 
                              onClick={resetTimer}
                              className="timer-control-btn"
                              size="sm"
                            >
                              <i className="bi bi-arrow-counterclockwise"></i> 리셋
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
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