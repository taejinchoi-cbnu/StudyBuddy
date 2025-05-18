import { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { format } from 'date-fns';

const EventForm = ({ event, onSave, onDelete, onCancel }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [error, setError] = useState('');

  // 수정 모드일 경우 폼 초기화
  useEffect(() => {
    console.log('🔍 EventForm useEffect, event:', event);
    if (event) {
      setTitle(event.title || '');
      
      // 그룹 이벤트인 경우 "[그룹명]" 제외하고 표시
      if (event.isGroupEvent && event.title && event.title.startsWith(`[${event.groupName}] `)) {
        console.log('🔍 그룹 이벤트 제목 처리');
        setTitle(event.title.substring(`[${event.groupName}] `.length));
      }
      
      try {
        console.log('🔍 날짜 포맷팅 시작', event.start, event.end);
        setStart(format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
        setEnd(format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"));
        console.log('🔍 날짜 포맷팅 완료', start, end);
      } catch (e) {
        console.error('🔍 날짜 포맷팅 오류:', e);
        // 날짜 포맷 오류 시 현재 시간으로 설정
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
        setStart(format(now, "yyyy-MM-dd'T'HH:mm"));
        setEnd(format(oneHourLater, "yyyy-MM-dd'T'HH:mm"));
      }
      
      setDescription(event.description || '');
      setIsAllDay(event.allDay || false);
    } else {
      // 새 이벤트 기본값
      console.log('🔍 새 이벤트 폼 초기화');
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
      
      setTitle('');
      setStart(format(now, "yyyy-MM-dd'T'HH:mm"));
      setEnd(format(oneHourLater, "yyyy-MM-dd'T'HH:mm"));
      setDescription('');
      setIsAllDay(false);
    }
  }, [event]);
  
  const handleSubmit = (e) => {
    console.log('🔍 폼 제출 시작');
    e.preventDefault();
    
    // 유효성 검사
    if (!title.trim()) {
      console.log('🔍 제목 누락 오류');
      setError('제목을 입력해주세요.');
      return;
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    console.log('🔍 날짜 유효성 검사', { startDate, endDate });
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log('🔍 유효하지 않은 날짜');
      setError('유효한 날짜와 시간을 입력해주세요.');
      return;
    }
    
    if (startDate >= endDate) {
      console.log('🔍 시작 시간이 종료 시간보다 늦음');
      setError('종료 시간은 시작 시간보다 이후여야 합니다.');
      return;
    }
    
    // 이벤트 데이터 구성
    const eventData = {
      ...(event ? { id: event.id } : {}),
      title,
      start: startDate,
      end: endDate,
      description,
      allDay: isAllDay
    };
    
    console.log('🔍 이벤트 데이터 구성 완료:', eventData);
    onSave(eventData);
  };
  
  // 그룹 이벤트인지 확인
  const isGroupEvent = event && event.isGroupEvent;
  console.log('🔍 그룹 이벤트 여부:', isGroupEvent);

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4 className="mb-0">{event ? '일정 수정' : '새 일정 추가'}</h4>
      </div>
      <div className="card-body">
        {error && <Alert variant="danger">{error}</Alert>}
        
        {isGroupEvent && (
          <Alert variant="info">
            이 일정은 그룹 <strong>{event.groupName}</strong>의 일정입니다.
            그룹 일정은 수정할 수 없습니다.
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>제목</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => {
                console.log('🔍 제목 변경:', e.target.value);
                setTitle(e.target.value);
              }}
              disabled={isGroupEvent}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="종일"
              checked={isAllDay}
              onChange={(e) => {
                console.log('🔍 종일 설정 변경:', e.target.checked);
                setIsAllDay(e.target.checked);
              }}
              disabled={isGroupEvent}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>시작 시간</Form.Label>
            <Form.Control
              type={isAllDay ? "date" : "datetime-local"}
              value={start}
              onChange={(e) => {
                console.log('🔍 시작 시간 변경:', e.target.value);
                setStart(e.target.value);
              }}
              disabled={isGroupEvent}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>종료 시간</Form.Label>
            <Form.Control
              type={isAllDay ? "date" : "datetime-local"}
              value={end}
              onChange={(e) => {
                console.log('🔍 종료 시간 변경:', e.target.value);
                setEnd(e.target.value);
              }}
              disabled={isGroupEvent}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>설명</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => {
                console.log('🔍 설명 변경');
                setDescription(e.target.value);
              }}
              disabled={isGroupEvent}
            />
          </Form.Group>
          
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={() => {
              console.log('🔍 취소 버튼 클릭');
              onCancel();
            }}>
              취소
            </Button>
            
            <div>
              {event && !isGroupEvent && onDelete && (
                <Button
                  variant="danger"
                  onClick={() => {
                    console.log('🔍 삭제 버튼 클릭');
                    onDelete(event.id);
                  }}
                  className="me-2"
                >
                  삭제
                </Button>
              )}
              
              {!isGroupEvent && (
                <Button variant="primary" type="submit">
                  {event ? '수정' : '추가'}
                </Button>
              )}
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default EventForm;