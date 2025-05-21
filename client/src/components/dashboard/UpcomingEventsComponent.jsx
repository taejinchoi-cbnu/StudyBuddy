import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, ListGroup, Badge, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const UpcomingEventsComponent = ({ userGroups = [], onDataChange }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 24시간 이내 다가오는 일정 처리 - 이미 가져온 그룹 데이터 활용
  useEffect(() => {
    const processUpcomingEvents = () => {
      if (!currentUser || !userGroups || !Array.isArray(userGroups)) return;
      
      try {
        setIsProcessing(true);
        
        // 이미 부모 컴포넌트에서 가져온 그룹 데이터 사용
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간 이후
        
        const allEvents = [];
        
        // 각 그룹의 appointments 확인
        userGroups.forEach(group => {
          if (group.appointments && Array.isArray(group.appointments)) {
            group.appointments.forEach(appointment => {
              try {
                // appointment.day와 appointment.start를 조합하여 날짜 객체 생성
                const eventDate = parseAppointmentDate(appointment.day, appointment.start);
                
                // 24시간 이내에 있는 이벤트만 필터링
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
        
        // 시간순으로 정렬
        allEvents.sort((a, b) => a.eventDate - b.eventDate);
        
        setUpcomingEvents(allEvents);
      } catch (error) {
        console.error("일정 처리 중 오류:", error);
        setError("일정을 처리하는 중 문제가 발생했습니다.");
      } finally {
        setIsProcessing(false);
      }
    };
    
    processUpcomingEvents();
  }, [currentUser, userGroups]); // 의존성 배열 수정
  
  // 그룹 페이지로 이동
  const handleEventClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };
  
  // 남은 시간 계산
  const getTimeRemaining = useCallback((eventDate) => {
    const now = new Date();
    const diff = eventDate - now;
    
    // 밀리초를 시, 분으로 변환
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
    const today = now.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    
    // 요일 매핑 (한글 요일 -> 숫자)
    const dayMap = {
      "월요일": 1, "화요일": 2, "수요일": 3, "목요일": 4, 
      "금요일": 5, "토요일": 6, "일요일": 0,
      // 영문 약자 지원
      "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0
    };
    
    // 요일 이름 정규화 (앞 부분만 비교)
    let targetDay = -1;
    
    // 정확한 매칭 시도
    if (dayMap[dayString] !== undefined) {
      targetDay = dayMap[dayString];
    } else {
      // 부분 매칭 시도 (예: "월" -> "월요일", "Mon" -> "Monday")
      const dayKeys = Object.keys(dayMap);
      for (const key of dayKeys) {
        if (key.startsWith(dayString) || dayString.startsWith(key)) {
          targetDay = dayMap[key];
          break;
        }
      }
    }
    
    if (targetDay === -1) {
      console.warn(`알 수 없는 요일 형식: ${dayString}, 오늘로 설정합니다.`);
      targetDay = today; // 알 수 없는 요일은 오늘로 설정
    }
    
    // 현재 요일과의 차이 계산 (다음 주 해당 요일까지의 날짜 차이)
    let dayDiff = targetDay - today;
    if (dayDiff <= 0) {
      dayDiff += 7; // 이미 지난 요일이면 다음 주로
    }
    
    // 이벤트 날짜 생성
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + dayDiff);
    
    // 시간 설정
    try {
      let hours = 0, minutes = 0;
      if (timeString) {
        const timeParts = timeString.split(":");
        hours = parseInt(timeParts[0], 10) || 0;
        minutes = parseInt(timeParts[1], 10) || 0;
      }
      eventDate.setHours(hours, minutes, 0, 0);
    } catch (e) {
      console.warn(`시간 형식 오류: ${timeString}, 기본값 0:00으로 설정합니다.`);
      eventDate.setHours(0, 0, 0, 0);
    }
    
    return eventDate;
  }, []);
  
  return (
    <Card className={`shadow-sm ${darkMode ? "dark-mode" : ""}`}>
      <Card.Header>
        <h4 className="mb-0">다가오는 일정</h4>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {isProcessing ? (
          <div className="text-center py-3">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <ListGroup variant="flush">
            {upcomingEvents.map((event, index) => (
              <ListGroup.Item 
                key={`${event.groupId}_${index}`}
                action
                onClick={() => handleEventClick(event.groupId)}
                className={darkMode ? "dark-mode" : ""}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1">{event.title}</h5>
                    <p className="mb-1">
                      <Badge bg="primary" className="me-2">
                        {event.groupName}
                      </Badge>
                      {event.day} {event.start}-{event.end}
                    </p>
                  </div>
                  <Badge 
                    bg={index === 0 ? "danger" : "info"}
                    className="countdown-badge"
                  >
                    {getTimeRemaining(event.eventDate)}
                  </Badge>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-center text-muted py-3">
            24시간 이내 예정된 일정이 없습니다.
          </p>
        )}
      </Card.Body>
    </Card>
  );
};

export default UpcomingEventsComponent;