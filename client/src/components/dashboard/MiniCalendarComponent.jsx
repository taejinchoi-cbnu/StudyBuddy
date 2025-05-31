// src/components/dashboard/MiniCalendarComponent.jsx
import { useState, useEffect } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";

const MiniCalendarComponent = ({ userEvents = [] }) => {
  const { darkMode } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  // 캘린더 날짜 계산
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 이번 달 첫째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫째 주 시작일 (일요일부터)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // 3x3 = 9일만 표시 (중앙 주간)
    const days = [];
    const centerWeekStart = new Date(currentDate);
    centerWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 9; i++) {
      const day = new Date(centerWeekStart);
      day.setDate(centerWeekStart.getDate() + i);
      
      // 해당 날짜에 이벤트가 있는지 확인
      const hasEvent = userEvents.some(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === day.toDateString();
      });
      
      days.push({
        date: day,
        day: day.getDate(),
        isToday: day.toDateString() === new Date().toDateString(),
        isCurrentMonth: day.getMonth() === month,
        hasEvent
      });
    }
    
    setCalendarDays(days);
  }, [currentDate, userEvents]);

  return (
    <div className={`mini-calendar-component ${darkMode ? "dark-mode" : ""}`}>
      <div className="calendar-header">
        <h6 className="month-year">
          {currentDate.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long' 
          })}
        </h6>
      </div>
      
      <div className="calendar-grid">
        {calendarDays.map((day, index) => (
          <div 
            key={index}
            className={`calendar-day ${day.isToday ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''}`}
          >
            <span className="day-number">{day.day}</span>
            {day.hasEvent && <div className="event-dot"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniCalendarComponent;