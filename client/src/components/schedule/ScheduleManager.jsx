import { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Badge, Table, Alert, Modal, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import useLoading from '../../hooks/useLoading';
import '../../styles/ScheduleManager.css';

const ScheduleManager = ({
  // 공통 props
  currentUser,
  isAdmin,
  isLoading,
  
  // UnavailabilitySelector props
  userId,
  days,
  timeSlots,
  onAdd,
  existingTimes,
  onRemove,
  
  // AvailableTimesDisplay props
  availableTimeSlots,
  onSelectAppointment,
  existingAppointments,
  
  // 새로운 통합 props
  mode = "full", // "availability-only", "display-only", "full"
  showSteps = true,
  className = ""
}) => {
  // 상태 관리
  const [scheduleState, setScheduleState] = useState({
    // UnavailabilitySelector 상태
    selectedDay: "",
    startTime: "",
    endTime: "",
    userUnavailableTimes: [],
    
    // AvailableTimesDisplay 상태
    showAppointmentModal: false,
    selectedTime: null,
    appointmentTitle: "",
    
    // 공통 상태
    error: "",
    success: "",
    currentStep: 1
  });

  const { darkMode } = useDarkMode();

  // 시간 추가 핸들러
  const handleAddTime = () => {
    if (isLoading) return;
    
    const { selectedDay, startTime, endTime } = scheduleState;
    
    if (onAdd(userId, selectedDay, startTime, endTime)) {
      setScheduleState(prev => ({
        ...prev,
        startTime: "",
        endTime: "",
        success: "불가능한 시간이 추가되었습니다."
      }));
    }
  };

  // 시간 선택이 유효한지 확인
  const isTimeSelectionValid = () => {
    if (isLoading) return false;
    
    const { selectedDay, startTime, endTime } = scheduleState;
    return selectedDay && startTime && endTime && startTime < endTime;
  };

  // 시간 블록이 이미 일정으로 확정되었는지 확인
  const isTimeBlockScheduled = (day, start, end) => {
    return existingAppointments.some(app => 
      app.day === day && 
      app.start === start && 
      app.end === end
    );
  };

  // 시간 블록이 이미 선택되었는지 확인
  const isTimeBlockSelected = (day, start, end) => {
    if (!existingTimes || !Array.isArray(existingTimes)) {
      console.log('existingTimes가 유효하지 않음:', existingTimes);
      return false;
    }
    
    const isSelected = existingTimes.some(time => 
      time.day === day && 
      time.start === start && 
      time.end === end
    );
    
    console.log('시간 블록 선택 확인:', {
      day,
      start,
      end,
      existingTimes,
      isSelected
    });
    
    return isSelected;
  };

  // 시간 선택 핸들러
  const handleSelectTime = (day, block) => {
    console.log('시간 선택 시도:', { day, block, isLoading });
    
    if (isLoading) {
      console.log('로딩 중이므로 시간 선택 불가');
      return;
    }
    
    // 이미 선택된 시간인지 확인
    if (isTimeBlockSelected(day, block.start, block.end)) {
      console.log('이미 선택된 시간');
      setScheduleState(prev => ({
        ...prev,
        error: "이미 선택된 시간입니다."
      }));
      return;
    }
    
    console.log('시간 선택 성공');
    setScheduleState(prev => ({
      ...prev,
      selectedTime: { day, ...block },
      showAppointmentModal: true
    }));
  };

  // 일정 추가 핸들러
  const handleAddAppointment = () => {
    if (isLoading) return;
    
    const { selectedTime, appointmentTitle } = scheduleState;
    
    if (!appointmentTitle.trim()) {
      setScheduleState(prev => ({
        ...prev,
        error: "일정 제목을 입력해주세요."
      }));
      return;
    }

    // 이미 확정된 시간인지 확인
    if (isTimeBlockScheduled(selectedTime.day, selectedTime.start, selectedTime.end)) {
      setScheduleState(prev => ({
        ...prev,
        error: "이미 확정된 시간입니다."
      }));
      return;
    }

    const appointmentData = {
      id: `appointment_${Date.now()}`,
      title: appointmentTitle,
      day: selectedTime.day,
      start: selectedTime.start,
      end: selectedTime.end,
      createdAt: new Date().toISOString()
    };

    onSelectAppointment(appointmentData);
    
    setScheduleState(prev => ({
      ...prev,
      showAppointmentModal: false,
      selectedTime: null,
      appointmentTitle: "",
      success: "일정이 추가되었습니다."
    }));
  };

  // 시간 계산 헬퍼 함수
  const calculateDuration = (start, end) => {
    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);
    
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}시간 ${minutes > 0 ? `${minutes}분` : ''}`;
  };

  // 단계 표시기 렌더링
  const renderStepIndicator = () => {
    if (!showSteps) return null;
    
    return (
      <div className="mb-4">
        <ProgressBar>
          <ProgressBar 
            variant="primary" 
            now={mode === "availability-only" ? 50 : 100} 
            label={mode === "availability-only" ? "1/2" : "2/2"} 
          />
        </ProgressBar>
        <div className="d-flex justify-content-between mt-2">
          <small className="text-muted">불가능한 시간 입력</small>
          <small className="text-muted">가능한 시간 확인</small>
        </div>
      </div>
    );
  };

  // 불가능한 시간 입력 섹션 렌더링
  const renderUnavailabilitySection = () => {
    if (mode === "display-only") return null;

    return (
      <Card className="mb-4">
        <Card.Body>
          <h4 className="mb-3">불가능한 시간 입력</h4>
          <Form>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>요일</Form.Label>
                  <Form.Select
                    value={scheduleState.selectedDay}
                    onChange={(e) => setScheduleState(prev => ({
                      ...prev,
                      selectedDay: e.target.value
                    }))}
                    required
                    disabled={isLoading}
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
                    value={scheduleState.startTime}
                    onChange={(e) => setScheduleState(prev => ({
                      ...prev,
                      startTime: e.target.value
                    }))}
                    required
                    disabled={!scheduleState.selectedDay || isLoading}
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
                    value={scheduleState.endTime}
                    onChange={(e) => setScheduleState(prev => ({
                      ...prev,
                      endTime: e.target.value
                    }))}
                    required
                    disabled={!scheduleState.selectedDay || !scheduleState.startTime || isLoading}
                  >
                    <option value="">종료 시간</option>
                    {timeSlots
                      .filter(time => time > scheduleState.startTime)
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
                  {isLoading ? '처리 중...' : '추가'}
                </Button>
              </Col>
            </Row>
          </Form>
          
          <div className="mt-3">
            <h5>내가 참여 불가능한 시간:</h5>
            {existingTimes && existingTimes.length > 0 ? (
              <div className="d-flex flex-wrap">
                {existingTimes.map((time, index) => (
                  <Badge 
                    key={index} 
                    bg="danger" 
                    className="me-2 mb-2 p-2" 
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    onClick={() => !isLoading && onRemove(index)}
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
        </Card.Body>
      </Card>
    );
  };

  // 가능한 시간 표시 섹션 렌더링
  const renderAvailableTimesSection = () => {
    if (mode === "availability-only" || !availableTimeSlots || availableTimeSlots.length === 0) {
      return null;
    }

    const daysWithAvailableTimes = availableTimeSlots.filter(
      dayData => dayData.availableBlocks && dayData.availableBlocks.length > 0
    );

    if (daysWithAvailableTimes.length === 0) {
      return (
        <Alert variant="warning">
          모두가 가능한 시간이 없습니다. 불가능한 시간을 다시 조정해보세요.
        </Alert>
      );
    }

    return (
      <Card>
        <Card.Body>
          <h4 className="mb-3">모두가 가능한 시간</h4>
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
                        onClick={() => !isLoading && onSelectAppointment(app, 'delete')}
                        disabled={isLoading}
                      >
                        {isLoading ? '처리 중...' : '삭제'}
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
                              disabled={isScheduled || isLoading}
                            >
                              {isScheduled ? '확정됨' : isLoading ? '처리 중...' : '선택'}
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
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className={`schedule-manager ${darkMode ? "dark-mode" : ""} ${className}`}>
      {scheduleState.error && (
        <Alert variant="danger" className="mb-3">
          {scheduleState.error}
        </Alert>
      )}
      
      {scheduleState.success && (
        <Alert variant="success" className="mb-3">
          {scheduleState.success}
        </Alert>
      )}
      
      {renderStepIndicator()}
      {renderUnavailabilitySection()}
      {renderAvailableTimesSection()}
      
      {/* 일정 추가 모달 */}
      <Modal 
        show={scheduleState.showAppointmentModal} 
        onHide={() => !isLoading && setScheduleState(prev => ({
          ...prev,
          showAppointmentModal: false
        }))}
      >
        <Modal.Header closeButton>
          <Modal.Title>일정 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {scheduleState.selectedTime && (
            <div className="mb-3">
              <p>
                <strong>선택된 시간:</strong> {scheduleState.selectedTime.day} {scheduleState.selectedTime.start} - {scheduleState.selectedTime.end}
                <br />
                <small>({calculateDuration(scheduleState.selectedTime.start, scheduleState.selectedTime.end)})</small>
              </p>
            </div>
          )}
          <Form>
            <Form.Group>
              <Form.Label>일정 제목</Form.Label>
              <Form.Control
                type="text"
                value={scheduleState.appointmentTitle}
                onChange={(e) => setScheduleState(prev => ({
                  ...prev,
                  appointmentTitle: e.target.value
                }))}
                placeholder="예: 팀 프로젝트 미팅"
                required
                disabled={isLoading}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setScheduleState(prev => ({
              ...prev,
              showAppointmentModal: false
            }))}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddAppointment}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '추가'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ScheduleManager; 