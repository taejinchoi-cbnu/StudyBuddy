import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// date-fns 기반의 localizer 생성
const locales = {
  ko: ko,
};

// localizer 설정
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
  getDay,
  locales,
});

const CalendarView = ({ events, onSelectEvent }) => {
  const [view, setView] = useState('month');

  // 이벤트 스타일 지정
  const eventStyleGetter = useCallback((event) => {
    let style = {
      backgroundColor: event.isGroupEvent ? '#007bff' : '#28a745',
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };

    return {
      style,
    };
  }, []);

  // 캘린더 메시지 한글화
  const messages = {
    today: '오늘',
    previous: '이전',
    next: '다음',
    month: '월',
    week: '주',
    day: '일',
    agenda: '일정',
    date: '날짜',
    time: '시간',
    event: '일정',
    allDay: '하루종일',
    noEventsInRange: '이 기간 동안 일정이 없습니다.',
  };

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        view={view}
        onView={setView}
        messages={messages}
        popup
      />
    </div>
  );
};

export default CalendarView;
