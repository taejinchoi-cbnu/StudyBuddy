import { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import CalendarView from "../components/schedule/CalendarView";
import EventForm from "../components/schedule/EventForm";
import { getUserEvents, addUserEvent, updateUserEvent, deleteUserEvent } from "../utils/ScheduleService";
import { getUserGroups } from "../utils/GroupService";
import useFirebaseData from "../hooks/useFirebaseData";
import LoadingSpinner from "../components/LoadingSpinner";

const SchedulePage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();

  // 컴포넌트 상태 관리
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [isEventOperationLoading, setIsEventOperationLoading] = useState(false);
  
  // 메시지 상태
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 사용자 일정 데이터 가져오기
  const fetchUserEvents = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserEvents(currentUser.uid);
  }, [currentUser]);

  // 사용자 그룹 데이터 가져오기
  const fetchUserGroups = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserGroups(currentUser.uid);
  }, [currentUser]);

  // useFirebaseData로 사용자 일정 관리
  const {
    data: userEvents,
    loading: userEventsLoading,
    error: userEventsError,
    refetch: refetchUserEvents
  } = useFirebaseData(
    fetchUserEvents,
    [currentUser],
    {
      enabled: !!currentUser,
      initialData: [],
      onSuccess: (events) => {
        console.log("사용자 일정 로드 성공:", events?.length || 0, "개 일정");
        updateAllEvents(events, "user");
      },
      onError: (error) => {
        console.error("사용자 일정 로드 오류:", error);
        setErrorMessage("일정을 불러오는 데 실패했습니다.");
      }
    }
  );

  // useFirebaseData로 사용자 그룹 관리
  const {
    data: userGroups,
    loading: userGroupsLoading,
    error: userGroupsError,
    refetch: refetchUserGroups
  } = useFirebaseData(
    fetchUserGroups,
    [currentUser],
    {
      enabled: !!currentUser,
      initialData: [],
      onSuccess: (groups) => {
        console.log("그룹 데이터 로드 성공:", groups?.length || 0, "개 그룹");
        const groupEvents = extractGroupEvents(groups);
        console.log("추출된 그룹 일정:", groupEvents?.length || 0, "개");
        updateAllEvents(groupEvents, "group");
      },
      onError: (error) => {
        console.error("그룹 일정 로드 오류:", error);
        // 그룹 일정 로드 실패는 치명적이지 않음
      }
    }
  );

  // 그룹 일정 추출 함수
  const extractGroupEvents = useCallback((groups) => {
    if (!Array.isArray(groups)) return [];

    let groupEvents = [];
    for (const group of groups) {
      if (group && group.appointments && Array.isArray(group.appointments)) {
        group.appointments.forEach(appointment => {
          groupEvents.push({
            id: `group_${group.id}_${appointment.id}`,
            title: `[${group.name}] ${appointment.title}`,
            start: convertToDate(appointment.day, appointment.start),
            end: convertToDate(appointment.day, appointment.end),
            isGroupEvent: true,
            groupId: group.id,
            groupName: group.name,
            allDay: false
          });
        });
      }
    }
    return groupEvents;
  }, []);

  // 날짜 변환 함수
  const convertToDate = useCallback((dayString, timeString) => {
    try {
      if (!dayString || !timeString) {
        return new Date();
      }

      const dayMapping = {
        "월요일": "Mon", "화요일": "Tue", "수요일": "Wed", "목요일": "Thu",
        "금요일": "Fri", "토요일": "Sat", "일요일": "Sun"
      };
      const englishDay = dayMapping[dayString] || dayString;

      const days = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0 };
      const dayNum = days[englishDay];

      if (dayNum === undefined) {
        return new Date();
      }

      const today = new Date();
      const currentDay = today.getDay();
      let diff = dayNum - currentDay;

      if (diff <= 0) {
        diff += 7;
      }

      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);

      const [hours, minutes] = timeString.split(":").map(Number);
      targetDate.setHours(hours, minutes, 0, 0);

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
        const groupEvents = prevEvents.filter(event => event.isGroupEvent);
        return [...(newEvents || []), ...groupEvents];
      } else if (type === "group") {
        const userOnlyEvents = prevEvents.filter(event => !event.isGroupEvent);
        return [...userOnlyEvents, ...(newEvents || [])];
      }
      return prevEvents;
    });
  }, []);

  // 메시지 초기화 함수
  const clearMessages = useCallback(() => {
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  // 새 일정 추가 핸들러
  const handleAddEvent = useCallback(async (eventData) => {
    console.log("새 일정 추가 시작:", eventData);
    setIsEventOperationLoading(true);
    clearMessages();

    try {
      await addUserEvent(currentUser.uid, eventData);
      setSuccessMessage("일정이 성공적으로 추가되었습니다!");
      setShowEventForm(false);
      setSelectedEvent(null);
      await refetchUserEvents();
    } catch (error) {
      console.error("일정 추가 오류:", error);
      setErrorMessage("일정 추가에 실패했습니다: " + (error.message || ""));
    } finally {
      setIsEventOperationLoading(false);
    }
  }, [currentUser, clearMessages, refetchUserEvents]);

  // 일정 업데이트 핸들러
  const handleUpdateEvent = useCallback(async (eventData) => {
    console.log("일정 업데이트 시작:", eventData);
    setIsEventOperationLoading(true);
    clearMessages();

    try {
      // 그룹 일정은 수정 불가
      if (eventData.isGroupEvent) {
        setErrorMessage("그룹 일정은 수정할 수 없습니다.");
        return;
      }

      await updateUserEvent(currentUser.uid, eventData);
      setSuccessMessage("일정이 성공적으로 업데이트되었습니다!");
      setShowEventForm(false);
      setSelectedEvent(null);
      await refetchUserEvents();
    } catch (error) {
      console.error("일정 업데이트 오류:", error);
      setErrorMessage("일정 업데이트에 실패했습니다: " + (error.message || ""));
    } finally {
      setIsEventOperationLoading(false);
    }
  }, [currentUser, clearMessages, refetchUserEvents]);

  // 일정 삭제 핸들러
  const handleDeleteEvent = useCallback(async (eventId) => {
    console.log("일정 삭제 시작:", eventId);
    setIsEventOperationLoading(true);
    clearMessages();

    try {
      // 그룹 일정은 삭제 불가
      const eventToDelete = allEvents.find(e => e.id === eventId);
      if (eventToDelete?.isGroupEvent) {
        setErrorMessage("그룹 일정은 삭제할 수 없습니다.");
        return;
      }

      await deleteUserEvent(currentUser.uid, eventId);
      setSuccessMessage("일정이 성공적으로 삭제되었습니다!");
      setShowEventForm(false);
      setSelectedEvent(null);
      await refetchUserEvents();
    } catch (error) {
      console.error("일정 삭제 오류:", error);
      setErrorMessage("일정 삭제에 실패했습니다: " + (error.message || ""));
    } finally {
      setIsEventOperationLoading(false);
    }
  }, [currentUser, allEvents, clearMessages, refetchUserEvents]);

  // 일정 선택 핸들러
  const handleSelectEvent = useCallback((event) => {
    console.log("일정 선택:", event);
    setSelectedEvent(event);
    setShowEventForm(true);
    clearMessages();
  }, [clearMessages]);

  // 새 일정 폼 열기
  const handleNewEvent = useCallback(() => {
    console.log("새 일정 폼 열기");
    setSelectedEvent(null);
    setShowEventForm(true);
    clearMessages();
  }, [clearMessages]);

  // 폼 닫기
  const handleCloseForm = useCallback(() => {
    console.log("일정 폼 닫기");
    setShowEventForm(false);
    setSelectedEvent(null);
    clearMessages();
  }, [clearMessages]);

  // 로딩 상태 통합
  const isLoading = userEventsLoading || userGroupsLoading || isEventOperationLoading;

  // 에러 메시지 통합
  const hasError = errorMessage || userEventsError || userGroupsError;

  console.log("현재 상태:", {
    isLoading,
    hasError,
    allEventsCount: allEvents.length,
    userEventsCount: userEvents?.length || 0,
    groupsCount: userGroups?.length || 0
  });

  // 초기 로딩 상태 (데이터가 아직 없을 때만 스피너 표시)
  if (isLoading && allEvents.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`schedule-page ${darkMode ? "dark-mode" : ""}`}>
      <div className="navbar-spacer"></div>
      
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center schedule-header">
              <h1 className="mb-0">내 캘린더</h1>
              <Button
                variant="primary"
                onClick={handleNewEvent}
                className="add-schedule-btn"
                disabled={isLoading}
              >
                <i className="bi bi-plus-circle me-2"></i>
                새 일정 추가
              </Button>
            </div>

            {/* 에러 메시지 표시 */}
            {hasError && (
              <Alert 
                variant="danger" 
                className="mt-3" 
                onClose={() => setErrorMessage("")} 
                dismissible
              >
                {typeof hasError === 'string' ? hasError : hasError.message || "알 수 없는 오류가 발생했습니다."}
              </Alert>
            )}

            {/* 성공 메시지 표시 */}
            {successMessage && (
              <Alert 
                variant="success" 
                className="mt-3" 
                onClose={() => setSuccessMessage("")} 
                dismissible
              >
                {successMessage}
              </Alert>
            )}
          </Col>
        </Row>

        <Row>
          <Col md={showEventForm ? 8 : 12}>
            <Card className="schedule-card">
              <Card.Body className="p-0">
                {isLoading && (
                  <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10 }}>
                    <LoadingSpinner />
                  </div>
                )}
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
                  isLoading={isEventOperationLoading}
                  isGroupEvent={selectedEvent?.isGroupEvent || false}
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