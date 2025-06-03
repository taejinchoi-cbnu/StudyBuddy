// src/components/dashboard/TimerCardComponent.jsx
import { useState, useEffect, useCallback } from "react";
import { Button, Badge, Form } from "react-bootstrap";
import { useDarkMode } from "../../contexts/DarkModeContext";

const TimerCardComponent = () => {
  const { darkMode } = useDarkMode();
  
  // 타이머 상태
  const [timerMode, setTimerMode] = useState("work"); // work 또는 break
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60); // 기본값: 20분
  const [sessions, setSessions] = useState(0); // 완료한 세션 수
  
  // 입력 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(20);
  
  // 타이머 실행
  useEffect(() => {
    let timerId;
    
    if (timerRunning && secondsLeft > 0) {
      timerId = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // 타이머 종료 시 처리
            setTimerRunning(false);
            
            // 세션 완료 카운트
            setSessions(prevSessions => prevSessions + 1);
            
            // 브라우저 알림 (권한이 있는 경우)
            if (Notification.permission === "granted") {
              new Notification("⏰ 시간이 완료되었습니다!", {
                icon: "/favicon.ico",
                badge: "/favicon.ico"
              });
            }
            
            // 완료 후 초기값으로 리셋
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
  
  return (
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
  );
};

export default TimerCardComponent;