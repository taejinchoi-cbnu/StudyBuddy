import { useState, useEffect } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import StatWidget from "../common/StatWidget";

const MeetingStatsComponent = ({ userGroups = [], userEvents = [] }) => {
  const { darkMode } = useDarkMode();
  const [stats, setStats] = useState({
    totalGroups: 0,
    upcomingMeetings: 0,
    thisWeekMeetings: 0,
    completedMeetings: 0
  });

  useEffect(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // 이번 주 미팅 계산
    const thisWeekEvents = userEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    // 예정된 미팅 계산
    const upcomingEvents = userEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate > now;
    });

    // 완료된 미팅 계산 (지난 30일)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const completedEvents = userEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= thirtyDaysAgo && eventDate < now;
    });

    setStats({
      totalGroups: userGroups.length,
      upcomingMeetings: upcomingEvents.length,
      thisWeekMeetings: thisWeekEvents.length,
      completedMeetings: completedEvents.length
    });
  }, [userGroups, userEvents]);

  return (
    <div className={`meeting-stats-component ${darkMode ? "dark-mode" : ""}`}>
      <div className="stats-grid">
        <StatWidget 
          icon="bi-people-fill" 
          label="참여 그룹" 
          value={stats.totalGroups}
          color="info"
          size="compact"
        />
        <StatWidget 
          icon="bi-calendar-event" 
          label="예정 미팅" 
          value={stats.upcomingMeetings}
          color="warning"
          size="compact"
        />
        <StatWidget 
          icon="bi-calendar-week" 
          label="이번 주" 
          value={stats.thisWeekMeetings}
          color="success"
          size="compact"
        />
        <StatWidget 
          icon="bi-check-circle" 
          label="완료 미팅" 
          value={stats.completedMeetings}
          color="secondary"
          size="compact"
        />
      </div>
    </div>
  );
};

export default MeetingStatsComponent;