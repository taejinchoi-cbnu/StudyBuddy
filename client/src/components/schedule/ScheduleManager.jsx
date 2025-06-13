import { useState } from 'react';
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Table,
  Alert,
  Modal,
  ProgressBar,
} from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import '../../styles/components/ScheduleManager.css';

const ScheduleManager = ({
  isAdmin,
  isLoading,
  userId,
  days,
  timeSlots,
  onAdd,
  existingTimes,
  onRemove,
  availableTimeSlots,
  onSelectAppointment,
  existingAppointments,
  mode = 'full', 
  showSteps = true,
  className = '',
}) => {
  //사용자가 선택한 요일이랑 시간 추적
  const [pickedDay, setPickedDay] = useState('');
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  
  //모달 관련
  const [showModal, setShowModal] = useState(false);
  const [chosenTimeSlot, setChosenTimeSlot] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  
  //에러메시지, 성공메시지
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { darkMode } = useDarkMode();

  //불가능한 시간 추가할때
  const addUnavailableTime = () => {
    if (isLoading) return;

    //필요한 정보 다 있는지 확인
    if (!pickedDay || !startHour || !endHour) {
      setErrorMsg('모든 필드를 선택해주세요.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    if (startHour >= endHour) {
      setErrorMsg('시작 시간이 종료 시간보다 늦을 수 없습니다.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    if (onAdd(userId, pickedDay, startHour, endHour)) {
      //폼 초기화
      setStartHour('');
      setEndHour('');
      setSuccessMsg('불가능한 시간이 추가되었습니다.');
      //성공 메시지 잠시 후 사라지게
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  //폼 제대로 작성했는지 체크
  const canAddTime = () => {
    if (isLoading) return false;
    return pickedDay && startHour && endHour && startHour < endHour;
  };

  //이미 확정된 일정 있는지 확인
  const isAlreadyBooked = (day, start, end) => {
    //기존 일정들 돌면서 확인
    for (let i = 0; i < existingAppointments.length; i++) {
      const app = existingAppointments[i];
      if (app.day === day && app.start === start && app.end === end) {
        return true;
      }
    }
    return false;
  };

  //이미 불가능한 시간으로 선택됐는지
  const isTimeAlreadyPicked = (day, start, end) => {
    if (!existingTimes) return false;
    if (!Array.isArray(existingTimes)) return false;

    //기존 시간들 하나씩 체크
    for (const time of existingTimes) {
      if (time.day === day && time.start === start && time.end === end) {
        return true;
      }
    }
    return false;
  };

  //관리자가 시간 클릭해서 일정 만들때
  const pickTimeForAppointment = (day, block) => {
    if (isLoading) {
      return;
    }

    //이미 선택된건 못하게
    if (isTimeAlreadyPicked(day, block.start, block.end)) {
      setErrorMsg('이미 선택된 시간입니다.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    //선택한거 저장하고 모달 보여주기
    setChosenTimeSlot({ day, ...block });
    setShowModal(true);
  };

  //일정 추가할때
  const createNewAppointment = () => {
    if (isLoading) return;

    if (!eventTitle.trim()) {
      setErrorMsg('일정 제목을 입력해주세요.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    //이미 확정된 시간인지 다시 한번 체크
    if (isAlreadyBooked(chosenTimeSlot.day, chosenTimeSlot.start, chosenTimeSlot.end)) {
      setErrorMsg('이미 확정된 시간입니다.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    //일정 데이터 만들기
    const newAppointment = {
      id: `appointment_${Date.now()}`,
      title: eventTitle,
      day: chosenTimeSlot.day,
      start: chosenTimeSlot.start,
      end: chosenTimeSlot.end,
      createdAt: new Date().toISOString(),
    };

    onSelectAppointment(newAppointment);

    //모달 닫고 폼 초기화
    setShowModal(false);
    setChosenTimeSlot(null);
    setEventTitle('');
    setSuccessMsg('일정이 추가되었습니다.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  //시간 계산하기 (몇시간 몇분인지)
  const getTimeLength = (start, end) => {
    //시간을 분으로 바꿔서 계산
    const startTime = start.split(':');
    const endTime = end.split(':');
    
    const startMin = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMin = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    
    const totalMin = endMin - startMin;
    const hour = Math.floor(totalMin / 60);
    const min = totalMin % 60;

    if (min > 0) {
      return `${hour}시간 ${min}분`;
    } else {
      return `${hour}시간`;
    }
  };

  //단계 표시 (프로그레스바)
  const showProgress = () => {
    if (!showSteps) return null;

    let percentage = 100;
    let stepText = '2/2';
    if (mode === 'availability-only') {
      percentage = 50;
      stepText = '1/2';
    }

    return (
      <div className="mb-4">
        <ProgressBar>
          <ProgressBar
            variant="primary"
            now={percentage}
            label={stepText}
          />
        </ProgressBar>
        <div className="d-flex justify-content-between mt-2">
          <small className="text-muted">불가능한 시간 입력</small>
          <small className="text-muted">가능한 시간 확인</small>
        </div>
      </div>
    );
  };

  //불가능한 시간 입력하는 부분
  const showUnavailableTimeForm = () => {
    if (mode === 'display-only') return null;

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
                    value={pickedDay}
                    onChange={(e) => setPickedDay(e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    <option value="">요일 선택</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>시작 시간</Form.Label>
                  <Form.Select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    required
                    disabled={!pickedDay || isLoading}
                  >
                    <option value="">시작 시간</option>
                    {timeSlots.map((time) => (
                      <option key={`start-${time}`} value={time}>
                        {time}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>종료 시간</Form.Label>
                  <Form.Select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    required
                    disabled={!pickedDay || !startHour || isLoading}
                  >
                    <option value="">종료 시간</option>
                    {timeSlots
                      .filter((time) => time > startHour)
                      .map((time) => (
                        <option key={`end-${time}`} value={time}>
                          {time}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3} className="d-flex align-items-end">
                <button
                  className="btn-schedule-action btn-primary w-100"
                  onClick={addUnavailableTime}
                  disabled={!canAddTime()}
                >
                  {isLoading ? '처리 중...' : '추가'}
                </button>
              </Col>
            </Row>
          </Form>

          <div className="mt-3">
            <h5>내가 참여 불가능한 시간:</h5>
            {existingTimes && existingTimes.length > 0 ? (
              <div className="d-flex flex-wrap">
                {existingTimes.map((time, idx) => (
                  <Badge
                    key={idx}
                    bg="danger"
                    className="me-2 mb-2 p-2"
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    onClick={() => {
                      if (!isLoading) {
                        onRemove(idx);
                      }
                    }}
                  >
                    {time.day} {time.start} - {time.end} &times;
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted">아직 추가된 시간이 없습니다.</p>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  //가능한 시간들 보여주는 부분
  const showAvailableTimes = () => {
    if (mode === 'availability-only') return null;
    if (!availableTimeSlots) return null;
    if (availableTimeSlots.length === 0) return null;

    //실제로 가능한 시간이 있는 날들만 골라내기
    const goodDays = [];
    for (const dayData of availableTimeSlots) {
      if (dayData.availableBlocks && dayData.availableBlocks.length > 0) {
        goodDays.push(dayData);
      }
    }

    if (goodDays.length === 0) {
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
            아래는 모든 멤버가 참여 가능한 시간입니다. 최소 1시간 이상 가능한
            시간만 표시됩니다.
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
                        ({getTimeLength(app.start, app.end)})
                      </small>
                    </div>
                    {isAdmin && (
                      <button
                        className="btn-schedule-action btn-outline-danger"
                        onClick={() => {
                          if (!isLoading) {
                            onSelectAppointment(app, 'delete');
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? '처리 중...' : '삭제'}
                      </button>
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
              {goodDays.map((dayData, idx) => (
                <tr key={idx}>
                  <td width="20%">
                    <strong>{dayData.day}</strong>
                  </td>
                  <td>
                    {dayData.availableBlocks.map((block, blockIdx) => {
                      const alreadyBooked = isAlreadyBooked(dayData.day, block.start, block.end);

                      return (
                        <div
                          key={blockIdx}
                          className="mb-1 d-flex align-items-center"
                        >
                          <Badge
                            bg={alreadyBooked ? 'secondary' : 'success'}
                            className="me-2"
                          >
                            {block.start} - {block.end}
                          </Badge>
                          <small className="text-muted me-2">
                            ({getTimeLength(block.start, block.end)})
                          </small>
                          {alreadyBooked && (
                            <Badge bg="info" className="me-2">
                              확정됨
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </td>
                  {isAdmin && (
                    <td>
                      {dayData.availableBlocks.map((block, blockIdx) => {
                        const alreadyBooked = isAlreadyBooked(dayData.day, block.start, block.end);

                        return (
                          <div key={blockIdx} className="mb-1">
                            <button
                              className="btn-schedule-action btn-outline-primary"
                              onClick={() => pickTimeForAppointment(dayData.day, block)}
                              disabled={alreadyBooked || isLoading}
                            >
                              {alreadyBooked ? '확정됨' : (isLoading ? '처리 중...' : '선택')}
                            </button>
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
              관리자가 일정 확정하면 다 보임
            </small>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div
      className={`schedule-manager ${darkMode ? 'dark-mode' : ''} ${className}`}
    >
      {errorMsg && (
        <Alert variant="danger" className="mb-3">
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" className="mb-3">
          {successMsg}
        </Alert>
      )}

      {showProgress()}
      {showUnavailableTimeForm()}
      {showAvailableTimes()}

      {/*일정 만들기 모달*/}
      <Modal
        show={showModal}
        onHide={() => {
          if (!isLoading) {
            setShowModal(false);
          }
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>일정 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {chosenTimeSlot && (
            <div className="mb-3">
              <p>
                <strong>선택된 시간:</strong> {chosenTimeSlot.day} {chosenTimeSlot.start} - {chosenTimeSlot.end}
                <br />
                <small>
                  ({getTimeLength(chosenTimeSlot.start, chosenTimeSlot.end)})
                </small>
              </p>
            </div>
          )}
          <Form>
            <Form.Group>
              <Form.Label>일정 제목</Form.Label>
              <Form.Control
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="예: 팀 프로젝트 미팅"
                required
                disabled={isLoading}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="action-btn-secondary"
            onClick={() => setShowModal(false)}
            disabled={isLoading}
          >
            취소
          </button>
          <button
            className="action-btn-primary"
            onClick={createNewAppointment}
            disabled={isLoading}
          >
            {isLoading ? '처리 중...' : '추가'}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ScheduleManager;
