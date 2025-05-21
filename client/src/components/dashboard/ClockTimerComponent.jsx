import { useState, useEffect, useCallback } from "react";
import { Button, Badge } from "react-bootstrap";
import { useDarkMode } from "../../contexts/DarkModeContext";

const ClockTimerComponent = () => {
  const { darkMode } = useDarkMode();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimer, setIsTimer] = useState(false);
  
  // 포모도로 타이머 관련 상태
  const [timerMode, setTimerMode] = useState("work"); // work 또는 break
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 기본값: 25분
  const [workDuration, setWorkDuration] = useState(25); // 작업 시간(분)
  const [breakDuration, setBreakDuration] = useState(5); // 휴식 시간(분)
  
  // 시간 업데이트 (시계 모드)
  useEffect(() => {
    let timerId;
    
    if (!isTimer) {
      // 시계 모드일 때는 1초마다 현재 시간 업데이트
      timerId = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isTimer]);
  
  // 타이머 실행 (타이머 모드)
  useEffect(() => {
    let timerId;
    
    if (isTimer && timerRunning && secondsLeft > 0) {
      timerId = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // 타이머 종료 시 모드 전환
            const newMode = timerMode === "work" ? "break" : "work";
            setTimerMode(newMode);
            
            // 알림음 재생 (브라우저에서 지원하는 경우)
            try {
              const audio = new Audio("/notification.mp3");
              audio.play().catch(e => console.log("알림음 재생 실패:", e));
            } catch (error) {
              console.log("알림음 지원하지 않음");
            }
            
            // 다음 세션 시간 설정
            return newMode === "work" ? workDuration * 60 : breakDuration * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isTimer, timerRunning, secondsLeft, timerMode, workDuration, breakDuration]);
  
  // 시간 형식 변환 (시:분:초)
  const formatTime = useCallback((date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, []);
  
  // 타이머 시간 형식 변환 (분:초)
  const formatTimerTime = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, []);
  
  // 모드 전환 핸들러
  const toggleMode = () => {
    if (isTimer) {
      // 타이머 모드에서 시계 모드로 전환
      setTimerRunning(false);
      setIsTimer(false);
    } else {
      // 시계 모드에서 타이머 모드로 전환
      setTimerMode("work");
      setSecondsLeft(workDuration * 60);
      setIsTimer(true);
    }
  };
  
  // 타이머 시작/정지 핸들러
  const toggleTimer = () => {
    setTimerRunning(prev => !prev);
  };
  
  // 타이머 리셋 핸들러
  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsLeft(timerMode === "work" ? workDuration * 60 : breakDuration * 60);
  };
  
  return (
    <div className={`clock-component ${darkMode ? "dark-mode" : ""}`}>
      {!isTimer ? (
        // 시계 모드
        <div className="clock-container">
          <div className="clock-display">
            <h1 className="clock-time">{formatTime(currentTime)}</h1>
            <p className="clock-date">{currentTime.toLocaleDateString()}</p>
          </div>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={toggleMode}
            className="mode-toggle-btn"
          >
            <i className="bi bi-alarm"></i> 타이머 보기
          </Button>
        </div>
      ) : (
        // 타이머 모드
        <div className="timer-container">
          <Badge 
            bg={timerMode === "work" ? "danger" : "success"} 
            className="timer-badge"
          >
            {timerMode === "work" ? "집중 시간" : "휴식 시간"}
          </Badge>
          
          <h1 className="timer-display">
            {formatTimerTime(secondsLeft)}
          </h1>
          
          <div className="timer-controls">
            <Button 
              variant={timerRunning ? "warning" : "primary"} 
              onClick={toggleTimer}
              className="timer-btn"
            >
              {timerRunning ? 
                <><i className="bi bi-pause-fill"></i> 일시정지</> : 
                <><i className="bi bi-play-fill"></i> 시작</>
              }
            </Button>
            <Button 
              variant="secondary" 
              onClick={resetTimer}
              className="timer-btn"
            >
              <i className="bi bi-arrow-counterclockwise"></i> 리셋
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={toggleMode}
              className="timer-btn"
            >
              <i className="bi bi-clock"></i> 시계 보기
            </Button>
          </div>
          
          <div className="timer-settings">
            <div className="timer-setting-item">
              <span>집중: {workDuration}분</span>
              <input 
                type="range" 
                min="1" 
                max="60" 
                value={workDuration} 
                onChange={(e) => setWorkDuration(parseInt(e.target.value, 10))}
                disabled={timerRunning}
                className="timer-slider"
              />
            </div>
            <div className="timer-setting-item">
              <span>휴식: {breakDuration}분</span>
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={breakDuration} 
                onChange={(e) => setBreakDuration(parseInt(e.target.value, 10))}
                disabled={timerRunning}
                className="timer-slider"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClockTimerComponent;