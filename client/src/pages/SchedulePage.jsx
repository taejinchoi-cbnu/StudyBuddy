import { useState, useCallback } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import CalendarView from "../components/schedule/CalendarView";
import EventForm from "../components/schedule/EventForm";
import { getUserEvents, addUserEvent, updateUserEvent, deleteUserEvent } from "../utils/ScheduleService";
import { getUserGroups } from "../utils/GroupService";
import useLoading from "../hooks/useLoading";
import useFirebaseData from "../hooks/useFirebaseData";
import LoadingSpinner from "../components/LoadingSpinner";

const SchedulePage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  
  // 일반 상태 관리
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isEventLoading, startEventLoading] = useLoading();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [allEvents, setAllEvents] = useState([]); // 모든 일정을 통합 관리
  
  // fetchFunction들을 useCallback으로 메모이제이션 (무한 루프 방지)
  const fetchUserEvents = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserEvents(currentUser.uid);
  }, [currentUser]);

  const fetchUserGroups = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserGroups(currentUser.uid);
  }, [currentUser]);
  
  // useFirebaseData를 사용하여 사용자 일정 가져오기
  const {
    data: userEvents,
    loading: userEventsLoading,
    error: userEventsError,
    refetch: refetchUserEvents,
    isSuccess: isUserEventsSuccess
  } = useFirebaseData(
    // fetchFunction: 메모이제이션된 함수 사용
    fetchUserEvents,
    // dependencies: currentUser가 변경되면 다시 실행
    [currentUser],
    {
      enabled: !!currentUser, // 사용자가 있을 때만 자동 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (eventsData) => {
        console.log("사용자 일정 로드 성공:", eventsData?.length || 0, "개 일정");
        // 성공 시 통합 이벤트 배열 업데이트 (사용자 일정 부분)
        updateAllEvents(eventsData, "user");
      },
      onError: (error) => {
        console.error("사용자 일정 로드 오류:", error);
        setError("일정을 불러오는 데 실패했습니다.");
      }
    }
  );
  
  // useFirebaseData를 사용하여 그룹 정보 가져오기 (그룹 일정을 위해)
  const {
    data: userGroups,
    loading: userGroupsLoading,
    error: userGroupsError,
    refetch: refetchUserGroups,
    isSuccess: isUserGroupsSuccess
  } = useFirebaseData(
    // fetchFunction: 메모이제이션된 함수 사용
    fetchUserGroups,
    // dependencies: currentUser가 변경되면 다시 실행
    [currentUser],
    {
      enabled: !!currentUser && isUserEventsSuccess, // 사용자 일정 로드 성공 후에만 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (groupsData) => {
        console.log("그룹 데이터 로드 성공:", groupsData?.length || 0, "개 그룹");
        
        // 그룹 일정 추출 및 변환
        const groupEvents = extractGroupEvents(groupsData);
        console.log("추출된 그룹 일정:", groupEvents?.length || 0, "개");
        
        // 성공 시 통합 이벤트 배열 업데이트 (그룹 일정 부분)
        updateAllEvents(groupEvents, "group");
      },
      onError: (error) => {
        console.error("그룹 일정 로드 오류:", error);
        // 그룹 일정 로드에 실패해도 사용자 일정은 표시
      }
    }
  );
  
  // 그룹 일정 추출 함수
  const extractGroupEvents = useCallback((groups) => {
    if (!Array.isArray(groups)) return [];
    
    let groupEvents = [];
    
    for (const group of groups) {
      if (group && group.appointments && Array.isArray(group.appointments)) {
        console.log(`🔍 그룹 ${group.id}의 일정 처리 중:`, group.appointments.length);
        
        const formattedEvents = group.appointments.map(appointment => ({
          id: `group_${group.id}_${appointment.id}`,
          title: `[${group.name}] ${appointment.title}`,
          start: convertToDate(appointment.day, appointment.start),
          end: convertToDate(appointment.day, appointment.end),
          isGroupEvent: true,
          groupId: group.id,
          groupName: group.name,
          allDay: false
        }));
        
        groupEvents = [...groupEvents, ...formattedEvents];
      }
    }
    
    return groupEvents;
  }, []);
  
  // 요일 문자열과 시간 문자열을 Date 객체로 변환
  const convertToDate = useCallback((dayString, timeString) => {
    console.log("convertToDate 호출:", { dayString, timeString });
    try {
      if (!dayString || !timeString) {
        console.log("유효하지 않은 입력, 현재 시간 반환");
        return new Date();
      }
      
      // 한글 요일명을 영문으로 매핑
      const dayMapping = {
        "월요일": "Mon", "화요일": "Tue", "수요일": "Wed", "목요일": "Thu", 
        "금요일": "Fri", "토요일": "Sat", "일요일": "Sun"
      };
      
      // 한글 요일명이면 영문으로 변환
      const englishDay = dayMapping[dayString] || dayString;
      
      const days = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0 };
      const dayNum = days[englishDay];
      
      if (dayNum === undefined) {
        console.log("알 수 없는 요일:", dayString, "->", englishDay);
        return new Date();
      }
      
      // 현재 날짜 기준으로 요일에 맞는 날짜 계산
      const today = new Date();
      const currentDay = today.getDay(); // 0: 일요일, 1: 월요일, ...
      let diff = dayNum - currentDay;
      
      // 같은 요일이거나 이미 지난 요일이면 다음 주로 설정
      if (diff <= 0) {
        diff += 7;
      }
      
      // 날짜 설정
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      
      // 시간 설정
      const [hours, minutes] = timeString.split(":").map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      
      console.log("변환된 날짜:", targetDate);
      return targetDate;
    } catch (error) {
      console.error("날짜 변환 오류:", error);
      return new Date();
    }
  }, []);
  
  // 통합 이벤트 배열 업데이트 함수
  const updateAllEvents = useCallback((newEvents, type) => {
    setAllEvents(prevEvents => {
      if (type === "user") {
        // 사용자 일정 업데이트: 기존 그룹 일정은 유지하고 사용자 일정만 교체
        const groupEvents = prevEvents.filter(event => event.isGroupEvent);
        return [...(newEvents || []), ...groupEvents];
      } else if (type === "group") {
        // 그룹 일정 업데이트: 기존 사용자 일정은 유지하고 그룹 일정만 교체
        const userOnlyEvents = prevEvents.filter(event => !event.isGroupEvent);
        return [...userOnlyEvents, ...(newEvents || [])];
      }
      return prevEvents;
    });
  }, []);
  
  // 새 일정 추가
  const handleAddEvent = useCallback(async (eventData) => {
    console.log("새 일정 추가 시작:", eventData);
    try {
      setError("");
      
      const newEvent = await startEventLoading(addUserEvent(currentUser.uid, eventData));
      console.log("새 일정 추가 완료:", newEvent);
      
      // 사용자 일정 다시 로드
      await refetchUserEvents();
      
      setShowEventForm(false);
      setSuccess("일정이 추가되었습니다.");
    } catch (error) {
      console.error("일정 추가 오류:", error);
      setError("일정을 추가하는 데 실패했습니다.");
    }
  }, [currentUser, startEventLoading, refetchUserEvents]);
  
  // 일정 업데이트
  const handleUpdateEvent = useCallback(async (eventData) => {
    console.log("일정 업데이트 시작:", eventData);
    try {
      setError("");
      
      // 그룹 일정은 수정 불가
      if (eventData.isGroupEvent) {
        setError("그룹 일정은 수정할 수 없습니다.");
        return;
      }
      
      const updatedEvent = await startEventLoading(updateUserEvent(currentUser.uid, eventData));
      console.log("일정 업데이트 완료:", updatedEvent);
      
      // 사용자 일정 다시 로드
      await refetchUserEvents();
      
      setSelectedEvent(null);
      setShowEventForm(false);
      setSuccess("일정이 업데이트되었습니다.");
    } catch (error) {
      console.error("일정 업데이트 오류:", error);
      setError("일정을 업데이트하는 데 실패했습니다.");
    }
  }, [currentUser, startEventLoading, refetchUserEvents]);
  
  // 일정 삭제
  const handleDeleteEvent = useCallback(async (eventId) => {
    console.log("일정 삭제 시작:", eventId);
    try {
      setError("");
      
      // 그룹 일정은 삭제 불가
      const eventToDelete = allEvents.find(e => e.id === eventId);
      if (eventToDelete?.isGroupEvent) {
        setError("그룹 일정은 삭제할 수 없습니다.");
        return;
      }
      
      await startEventLoading(deleteUserEvent(currentUser.uid, eventId));
      console.log("일정 삭제 완료");
      
      // 사용자 일정 다시 로드
      await refetchUserEvents();
      
      setSelectedEvent(null);
      setShowEventForm(false);
      setSuccess("일정이 삭제되었습니다.");
    } catch (error) {
      console.error("일정 삭제 오류:", error);
      setError("일정을 삭제하는 데 실패했습니다.");
    }
  }, [allEvents, currentUser, startEventLoading, refetchUserEvents]);
  
  // 일정 선택 핸들러
  const handleSelectEvent = useCallback((event) => {
    console.log("일정 선택:", event);
    setSelectedEvent(event);
    setShowEventForm(true);
  }, []);
  
  // 새 일정 폼 열기
  const handleNewEvent = useCallback(() => {
    console.log("새 일정 폼 열기");
    setSelectedEvent(null);
    setShowEventForm(true);
  }, []);
  
  // 폼 닫기
  const handleCloseForm = useCallback(() => {
    console.log("일정 폼 닫기");
    setShowEventForm(false);
    setSelectedEvent(null);
  }, []);
  
  // 로딩 상태 통합
  const isLoading = userEventsLoading || userGroupsLoading;
  const hasError = userEventsError || userGroupsError;
  
  console.log("현재 상태:", {
    isLoading,
    hasError,
    allEventsCount: allEvents.length,
    userEventsCount: userEvents?.length || 0,
    groupsCount: userGroups?.length || 0
  });
  
  if (isLoading) {
    console.log("로딩 스피너 표시");
    return <LoadingSpinner />;
  }

  return (
    <div className={`schedule-page ${darkMode ? "dark-mode" : ""}`}>
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center schedule-header">
              <h1 className="mb-0">내 캘린더</h1>
              <Button 
                variant="primary" 
                onClick={handleNewEvent}
                className="add-schedule-btn"
              >
                <i className="bi bi-plus-circle me-2"></i>
                새 일정 추가
              </Button>
            </div>
            
            {/* 에러 메시지 표시 */}
            {(error || hasError) && (
              <div className="alert alert-danger mt-3" role="alert">
                {error || hasError}
              </div>
            )}
            
            {/* 성공 메시지 표시 */}
            {success && (
              <div className="alert alert-success mt-3" role="alert">
                {success}
              </div>
            )}
          </Col>
        </Row>
        
        <Row>
          <Col md={showEventForm ? 8 : 12}>
            <Card className="schedule-card">
              <Card.Body className="p-0">
                <CalendarView 
                  events={allEvents}
                  onSelectEvent={handleSelectEvent}
                />
              </Card.Body>
            </Card>
          </Col>
          
          {showEventForm && (
            <Col md={4}>
              <div className="event-form-container">
                <EventForm 
                  event={selectedEvent}
                  onSave={selectedEvent && !selectedEvent.isGroupEvent ? handleUpdateEvent : handleAddEvent}
                  onDelete={selectedEvent && !selectedEvent.isGroupEvent ? handleDeleteEvent : null}
                  onCancel={handleCloseForm}
                />
              </div>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
};

export default SchedulePage;