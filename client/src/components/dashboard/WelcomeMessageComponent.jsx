import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const WelcomeMessageComponent = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();
  const [timeOfDay, setTimeOfDay] = useState("");
  
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
  
  // 사용자 이름 가져오기
  const displayName = userProfile?.displayName || currentUser?.email?.split("@")[0] || "사용자";
  
  return (
    <div className={`welcome-message-component ${darkMode ? "dark-mode" : ""}`}>
      <h3 className="welcome-message">
        안녕하세요, <span className="user-name">{displayName}</span>님 {timeOfDay}
      </h3>
    </div>
  );
};

export default WelcomeMessageComponent;