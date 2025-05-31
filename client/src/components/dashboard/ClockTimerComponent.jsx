import { useState, useEffect, useCallback } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";

const ClockTimerComponent = () => {
  const { darkMode } = useDarkMode();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 시간 업데이트 (시계 전용)
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timerId);
    };
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
  
  return (
    <div className={`clock-component ${darkMode ? "dark-mode" : ""}`}>
      <div className="clock-container">
        <div className="clock-display">
          <h1 className="clock-time">{formatTime(currentTime)}</h1>
          <p className="clock-date">{formatDate(currentTime)}</p>
        </div>
      </div>
    </div>
  );
};

export default ClockTimerComponent;