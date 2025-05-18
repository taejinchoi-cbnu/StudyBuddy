import { useState } from 'react';
import { Form, Button, Row, Col, Badge } from 'react-bootstrap';

const UnavailabilitySelector = ({ 
  userId, 
  days, 
  timeSlots, 
  onAdd, 
  existingTimes, 
  onRemove 
}) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // 시간 추가 핸들러
  const handleAddTime = () => {
    // onAdd 함수 호출하고 성공하면 폼 초기화
    if (onAdd(userId, selectedDay, startTime, endTime)) {
      setStartTime('');
      setEndTime('');
    }
  };

  // 시간 선택이 유효한지 확인
  const isTimeSelectionValid = () => {
    return selectedDay && startTime && endTime && startTime < endTime;
  };

  return (
    <div>
      {/* 시간 선택 폼 */}
      <Form>
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>요일</Form.Label>
              <Form.Select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                required
              >
                <option value="">요일 선택</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={3}>
            <Form.Group>
              <Form.Label>시작 시간</Form.Label>
              <Form.Select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={!selectedDay}
              >
                <option value="">시작 시간</option>
                {timeSlots.map(time => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={3}>
            <Form.Group>
              <Form.Label>종료 시간</Form.Label>
              <Form.Select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={!selectedDay || !startTime}
              >
                <option value="">종료 시간</option>
                {timeSlots
                  .filter(time => time > startTime) // 시작 시간 이후만 표시
                  .map(time => (
                    <option key={`end-${time}`} value={time}>{time}</option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={3} className="d-flex align-items-end">
            <Button 
              variant="primary" 
              onClick={handleAddTime}
              disabled={!isTimeSelectionValid()}
              className="w-100"
            >
              추가
            </Button>
          </Col>
        </Row>
      </Form>
      
      {/* 추가된 불가능 시간 목록 */}
      <div className="mt-3">
        <h5>내가 참여 불가능한 시간:</h5>
        {existingTimes && existingTimes.length > 0 ? (
          <div className="d-flex flex-wrap">
            {existingTimes.map((time, index) => (
              <Badge 
                key={index} 
                bg="danger" 
                className="me-2 mb-2 p-2" 
                style={{ cursor: 'pointer' }}
                onClick={() => onRemove(index)}
              >
                {time.day} {time.start} - {time.end} &times;
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted">아직 추가된 시간이 없습니다.</p>
        )}
        <small className="text-muted d-block mt-2">
          참고: 뱃지를 클릭하면 해당 시간이 삭제됩니다.
        </small>
      </div>
    </div>
  );
};

export default UnavailabilitySelector;