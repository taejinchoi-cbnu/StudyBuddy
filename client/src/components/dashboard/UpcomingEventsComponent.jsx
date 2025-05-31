// src/components/dashboard/UpcomingEventsComponent.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ListGroup, Badge, Alert, Spinner, Button } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const UpcomingEventsComponent = ({ userGroups = [], onDataChange }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 24시간 이내 다가오는 일정 처리
  const processUpcomingEvents = useCallback(() => {
    if (!currentUser || !userGroups || !Array.isArray(userGroups)) return;
    
    try {
      setIsProcessing(true);
      
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const allEvents = [];
      
      userGroups.forEach(group => {
        if (group.appointments && Array.isArray(group.appointments)) {
          group.appointments.forEach(appointment => {
            try {
              const eventDate = parseAppointmentDate(appointment.day, appointment.start);
              
              if (eventDate >= now && eventDate <= next24Hours) {
                allEvents.push({
                  ...appointment,
                  groupId: group.id,
                  groupName: group.name,
                  eventDate: eventDate
                });
              }
            } catch (err) {
              console.error("날짜 파싱 오류:", err);
            }
          });
        }
      });
      
      allEvents.sort((a, b) => a.eventDate - b.eventDate);
      setUpcomingEvents(allEvents);
    } catch (error) {
      console.error("일정 처리 중 오류:", error);
      setError("일정을 처리하는 중 문제가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, userGroups]);

  useEffect(() => {
    processUpcomingEvents();
  }, [processUpcomingEvents]);
  
  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError("");
    
    try {
      // 상위 컴포넌트의 데이터 새로고침 호출
      if (onDataChange) {
        await onDataChange();
      }
      
      // 잠시 대기 후 로컬 처리
      setTimeout(() => {
        processUpcomingEvents();
        setIsRefreshing(false);
      }, 500);
    } catch (error) {
      console.error("새로고침 오류:", error);
      setError("새로고침 중 오류가 발생했습니다.");
      setIsRefreshing(false);
    }
  };
  
  // 그룹 페이지로 이동
  const handleEventClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };
  
  // 남은 시간 계산
  const getTimeRemaining = useCallback((eventDate) => {
    const now = new Date();
    const diff = eventDate - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    }
    return `${minutes}분 남음`;
  }, []);
  
  // 요일과 시간 문자열을 Date 객체로 변환
  const parseAppointmentDate = useCallback((dayString, timeString) => {
    const now = new Date();
    const today = now.getDay();
    
    const dayMap = {
      "월요일": 1, "화요일": 2, "수요일": 3, "목요일": 4, 
      "금요일": 5, "토요일": 6, "일요일": 0,
      "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0
    };
    
    let targetDay = dayMap[dayString] ?? today;
    
    let dayDiff = targetDay - today;
    if (dayDiff <= 0) {
      dayDiff += 7;
    }
    
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + dayDiff);
    
    try {
      const [hours, minutes] = timeString.split(":").map(Number);
      eventDate.setHours(hours || 0, minutes || 0, 0, 0);
    } catch (e) {
      eventDate.setHours(0, 0, 0, 0);
    }
    
    return eventDate;
  }, []);

  return (
    <div className={`upcoming-events-component card-component ${darkMode ? "dark-mode" : ""}`}>
      {/* 카드 헤더 액션 */}
      <div className="card-component-header">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isProcessing}
          className="refresh-btn"
        >
          <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin' : ''}`}></i>
        </Button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="danger" className="card-alert">
          {error}
        </Alert>
      )}
      
      {/* 컨텐츠 영역 */}
      <div className="card-component-content">
        {isProcessing ? (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" />
            <p className="mt-2 mb-0 small">일정 정보를 처리하는 중...</p>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="upcoming-events-list">
            {upcomingEvents.slice(0, 3).map((event, index) => (
              <div 
                key={`${event.groupId}_${index}`}
                className="upcoming-event-item"
                onClick={() => handleEventClick(event.groupId)}
              >
                <div className="event-content">
                  <div className="event-info">
                    <h6 className="event-title">{event.title}</h6>
                    <div className="event-details">
                      <Badge bg="primary" className="group-badge">
                        {event.groupName}
                      </Badge>
                      <span className="event-time">
                        {event.day} {event.start}-{event.end}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    bg={index === 0 ? "danger" : "info"}
                    className="countdown-badge"
                  >
                    {getTimeRemaining(event.eventDate)}
                  </Badge>
                </div>
              </div>
            ))}
            
            {upcomingEvents.length > 3 && (
              <div className="more-events-info">
                <small className="text-muted">
                  외 {upcomingEvents.length - 3}개 일정 더 있음
                </small>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-calendar-x" style={{ fontSize: "2rem", color: "var(--text-muted)" }}></i>
            <p className="mt-2 mb-0 small text-muted">24시간 이내 예정된 일정이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEventsComponent;