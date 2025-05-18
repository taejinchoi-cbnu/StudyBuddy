import { useState } from 'react';
import { Table, Alert, Button, Form, Badge, Modal } from 'react-bootstrap';

const AvailableTimesDisplay = ({ 
  availableTimeSlots, 
  isAdmin = false,
  onSelectAppointment,
  existingAppointments = []
}) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [appointmentTitle, setAppointmentTitle] = useState('');
  
  // 가능한 시간이 없는 경우
  if (!availableTimeSlots || availableTimeSlots.length === 0) {
    return (
      <Alert variant="warning">
        모두가 가능한 시간이 없습니다. 불가능한 시간을 다시 조정해보세요.
      </Alert>
    );
  }

  // 가능한 시간이 있는 요일만 필터링
  const daysWithAvailableTimes = availableTimeSlots.filter(
    dayData => dayData.availableBlocks && dayData.availableBlocks.length > 0
  );

  // 가능한 시간이 없는 경우
  if (daysWithAvailableTimes.length === 0) {
    return (
      <Alert variant="warning">
        모두가 가능한 시간이 없습니다. 불가능한 시간을 다시 조정해보세요.
      </Alert>
    );
  }
  
  // 시간 선택 핸들러
  const handleSelectTime = (day, timeBlock) => {
    setSelectedTime({
      day,
      start: timeBlock.start,
      end: timeBlock.end
    });
    setShowAppointmentModal(true);
  };
  
  // 일정 저장 핸들러
  const handleSaveAppointment = () => {
    if (!appointmentTitle.trim()) return;
    
    const appointmentData = {
      id: `appointment_${Date.now()}`, // 고유 ID 생성
      title: appointmentTitle,
      day: selectedTime.day,
      start: selectedTime.start,
      end: selectedTime.end,
      createdAt: new Date().toISOString()
    };
    
    onSelectAppointment(appointmentData);
    setShowAppointmentModal(false);
    setAppointmentTitle('');
    setSelectedTime(null);
  };
  
  // 일정이 이미 있는지 확인하는 함수
  const isTimeBlockScheduled = (day, start, end) => {
    return existingAppointments.some(
      app => app.day === day && app.start === start && app.end === end
    );
  };

  return (
    <div>
      <p className="text-muted mb-3">
        아래는 모든 멤버가 참여 가능한 시간입니다. 최소 1시간 이상 가능한 시간만 표시됩니다.
      </p>
      
      {existingAppointments.length > 0 && (
        <div className="mb-4">
          <h5>확정된 일정:</h5>
          {existingAppointments.map((app, idx) => (
            <Alert key={idx} variant="success">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{app.title}</strong> - {app.day} {app.start} - {app.end}
                  <br />
                  <small className="text-muted">
                    {calculateDuration(app.start, app.end)}
                  </small>
                </div>
                {isAdmin && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => onSelectAppointment(app, 'delete')}
                  >
                    삭제
                  </Button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}
      
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>요일</th>
            <th>가능한 시간대</th>
            {isAdmin && <th width="150">작업</th>}
          </tr>
        </thead>
        <tbody>
          {daysWithAvailableTimes.map((dayData, index) => (
            <tr key={index}>
              <td width="20%"><strong>{dayData.day}</strong></td>
              <td>
                {dayData.availableBlocks.map((block, blockIndex) => {
                  const isScheduled = isTimeBlockScheduled(dayData.day, block.start, block.end);
                  
                  return (
                    <div key={blockIndex} className="mb-1 d-flex align-items-center">
                      <Badge 
                        bg={isScheduled ? "secondary" : "success"} 
                        className="me-2"
                      >
                        {block.start} - {block.end}
                      </Badge>
                      <small className="text-muted me-2">
                        ({calculateDuration(block.start, block.end)})
                      </small>
                      {isScheduled && (
                        <Badge bg="info" className="me-2">확정됨</Badge>
                      )}
                    </div>
                  );
                })}
              </td>
              {isAdmin && (
                <td>
                  {dayData.availableBlocks.map((block, blockIndex) => {
                    const isScheduled = isTimeBlockScheduled(dayData.day, block.start, block.end);
                    
                    return (
                      <div key={blockIndex} className="mb-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleSelectTime(dayData.day, block)}
                          disabled={isScheduled}
                        >
                          {isScheduled ? '확정됨' : '선택'}
                        </Button>
                      </div>
                    );
                  })}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      
      <div className="mt-3">
        <small className="text-muted">
          tip: 그룹 관리자가 일정을 확정하면 모든 멤버에게 표시됩니다.
        </small>
      </div>
      
      {/* 일정 추가 모달 */}
      <Modal show={showAppointmentModal} onHide={() => setShowAppointmentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>일정 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTime && (
            <div className="mb-3">
              <p>
                <strong>선택된 시간:</strong> {selectedTime.day} {selectedTime.start} - {selectedTime.end}
                <br />
                <small>({calculateDuration(selectedTime.start, selectedTime.end)})</small>
              </p>
            </div>
          )}
          <Form>
            <Form.Group>
              <Form.Label>일정 제목</Form.Label>
              <Form.Control
                type="text"
                value={appointmentTitle}
                onChange={(e) => setAppointmentTitle(e.target.value)}
                placeholder="예: 팀 프로젝트 미팅"
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAppointmentModal(false)}>
            취소
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveAppointment}
            disabled={!appointmentTitle.trim()}
          >
            일정 확정
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// 시간 간격 계산 함수
function calculateDuration(start, end) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  
  // 시간과 분으로 표시
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}분`;
  } else if (minutes === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${minutes}분`;
  }
}

export default AvailableTimesDisplay;