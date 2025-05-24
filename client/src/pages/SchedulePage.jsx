import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import CalendarView from '../components/schedule/CalendarView';
import EventForm from '../components/schedule/EventForm';
import { getUserEvents, addUserEvent, updateUserEvent, deleteUserEvent } from '../utils/ScheduleService';
import { getUserGroups } from '../utils/GroupService';
import useLoading from '../hooks/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';

const SchedulePage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isLoading, startLoading] = useLoading();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 사용자 일정 및 그룹 일정 로드
  useEffect(() => {
    if (!currentUser) return;

    const loadEvents = async () => {
      console.log('🔍 loadEvents 함수 시작');
      try {
        setError('');
        
        // 먼저 사용자 일정만 로드
        console.log('🔍 사용자 일정 로드 시작');
        const userEventsResult = await getUserEvents(currentUser.uid);
        console.log('🔍 사용자 일정 로드 완료:', userEventsResult);
        const loadedEvents = Array.isArray(userEventsResult) ? userEventsResult : [];
        
        // 일단 사용자 일정만 표시 (그룹 일정 로드 전)
        setEvents(loadedEvents);
        
        // 그룹 일정은 별도로 로드
        console.log('🔍 그룹 일정 로드 시작');
        try {
          const userGroups = await getUserGroups(currentUser.uid);
          console.log('🔍 그룹 데이터 로드 완료:', userGroups);
          
          let groupEvents = [];
          
          if (Array.isArray(userGroups)) {
            for (const group of userGroups) {
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
          }
          
          console.log('🔍 모든 그룹 일정 처리 완료:', groupEvents.length);
          
          // 사용자 일정과 그룹 일정 합치기
          setEvents(prev => [...prev, ...groupEvents]);
        } catch (groupError) {
          console.error('🔍 그룹 일정 로드 오류:', groupError);
          // 그룹 일정 로드에 실패해도 사용자 일정은 표시
        }
        
      } catch (error) {
        console.error('🔍 일정 로드 오류:', error);
        setError('일정을 불러오는 데 실패했습니다.');
        setEvents([]);
      } finally {
        console.log('🔍 loadEvents 함수 종료');
      }
    };
    
    loadEvents();

    // 안전 장치: 10초 후에 강제로 로딩 상태 해제 (디버깅용)
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.log('🔍 안전 장치: 10초 후 강제 로딩 해제');
        setEvents([]); // 빈 이벤트 배열 설정
        // isLoading은 직접 변경할 수 없으므로 컴포넌트가 렌더링되도록 이벤트 배열만 설정
      }
    }, 10000);
    
    return () => clearTimeout(safetyTimer);
  }, [currentUser]);
  
  // 요일 문자열과 시간 문자열을 Date 객체로 변환
  const convertToDate = (dayString, timeString) => {
    console.log('🔍 convertToDate 호출:', { dayString, timeString });
    try {
      if (!dayString || !timeString) {
        console.log('🔍 유효하지 않은 입력, 현재 시간 반환');
        return new Date();
      }
      
      const days = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
      const dayNum = days[dayString];
      
      if (dayNum === undefined) {
        console.log('🔍 알 수 없는 요일:', dayString);
        return new Date();
      }
      
      // 현재 날짜 기준으로 요일에 맞는 날짜 계산
      const today = new Date();
      const currentDay = today.getDay(); // 0: 일요일, 1: 월요일, ...
      const diff = dayNum - currentDay;
      
      // 날짜 설정
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff + (diff < 0 ? 7 : 0)); // 음수면 다음 주로 설정
      
      // 시간 설정
      const [hours, minutes] = timeString.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      
      console.log('🔍 변환된 날짜:', targetDate);
      return targetDate;
    } catch (error) {
      console.error('🔍 날짜 변환 오류:', error);
      return new Date();
    }
  };
  
  // 새 일정 추가
  const handleAddEvent = async (eventData) => {
    console.log('🔍 새 일정 추가 시작:', eventData);
    try {
      setError('');
      
      const newEvent = await startLoading(addUserEvent(currentUser.uid, eventData));
      console.log('🔍 새 일정 추가 완료:', newEvent);
      setEvents(prev => [...prev, newEvent]);
      setShowEventForm(false);
      setSuccess('일정이 추가되었습니다.');
    } catch (error) {
      console.error('🔍 일정 추가 오류:', error);
      setError('일정을 추가하는 데 실패했습니다.');
    }
  };
  
  // 일정 업데이트
  const handleUpdateEvent = async (eventData) => {
    console.log('🔍 일정 업데이트 시작:', eventData);
    try {
      setError('');
      
      // 그룹 일정은 수정 불가
      if (eventData.isGroupEvent) {
        setError('그룹 일정은 수정할 수 없습니다.');
        return;
      }
      
      const updatedEvent = await startLoading(updateUserEvent(currentUser.uid, eventData));
      console.log('🔍 일정 업데이트 완료:', updatedEvent);
      setEvents(prev => prev.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));
      setSelectedEvent(null);
      setShowEventForm(false);
      setSuccess('일정이 업데이트되었습니다.');
    } catch (error) {
      console.error('🔍 일정 업데이트 오류:', error);
      setError('일정을 업데이트하는 데 실패했습니다.');
    }
  };
  
  // 일정 삭제
  const handleDeleteEvent = async (eventId) => {
    console.log('🔍 일정 삭제 시작:', eventId);
    try {
      setError('');
      
      // 그룹 일정은 삭제 불가
      const eventToDelete = events.find(e => e.id === eventId);
      if (eventToDelete?.isGroupEvent) {
        setError('그룹 일정은 삭제할 수 없습니다.');
        return;
      }
      
      await startLoading(deleteUserEvent(currentUser.uid, eventId));
      console.log('🔍 일정 삭제 완료');
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setSelectedEvent(null);
      setShowEventForm(false);
      setSuccess('일정이 삭제되었습니다.');
    } catch (error) {
      console.error('🔍 일정 삭제 오류:', error);
      setError('일정을 삭제하는 데 실패했습니다.');
    }
  };
  
  // 일정 선택 핸들러
  const handleSelectEvent = (event) => {
    console.log('🔍 일정 선택:', event);
    setSelectedEvent(event);
    setShowEventForm(true);
  };
  
  // 새 일정 폼 열기
  const handleNewEvent = () => {
    console.log('🔍 새 일정 폼 열기');
    setSelectedEvent(null);
    setShowEventForm(true);
  };
  
  // 폼 닫기
  const handleCloseForm = () => {
    console.log('🔍 일정 폼 닫기');
    setShowEventForm(false);
    setSelectedEvent(null);
  };

  console.log('🔍 현재 로딩 상태:', isLoading, '이벤트 수:', events.length);
  
  if (isLoading) {
    console.log('🔍 로딩 스피너 표시');
    return <LoadingSpinner />;
  }

  return (
    <div className={`schedule-page ${darkMode ? 'dark-mode' : ''}`}>
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
            
            {error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )}
            
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
                  events={events} 
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