import { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";

const WelcomeMessageComponent = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();
  const [greeting, setGreeting] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  
  // 시간대별 인사말 설정
  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // 시간대별 메시지 설정
      let newTimeOfDay = "";
      if (hour >= 6 && hour < 9) {
        newTimeOfDay = "아침";
      } else if (hour >= 9 && hour < 12) {
        newTimeOfDay = "오전";
      } else if (hour >= 12 && hour < 14) {
        newTimeOfDay = "점심";
      } else if (hour >= 14 && hour < 18) {
        newTimeOfDay = "오후";
      } else if (hour >= 18 && hour < 22) {
        newTimeOfDay = "저녁";
      } else if (hour >= 22 || hour < 1) {
        newTimeOfDay = "밤";
      } else {
        newTimeOfDay = "새벽";
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
    <Card className={`shadow-sm mb-4 ${darkMode ? "dark-mode" : ""}`}>
      <Card.Body>
        <h2 className="welcome-message">
          안녕하세요, <span className="user-name">{displayName}</span>님!
        </h2>
        <h3 className="time-greeting">
          좋은 {timeOfDay}입니다.
        </h3>
        <p className="text-muted mt-2">
          오늘도 StudyBuddy와 함께 효율적인 학습 시간을 보내세요.
        </p>
      </Card.Body>
    </Card>
  );
};

export default WelcomeMessageComponent;