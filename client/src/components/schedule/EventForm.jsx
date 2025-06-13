import { useState, useEffect, useCallback } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { format } from 'date-fns';

const EventForm = ({ event, onSave, onDelete, onCancel }) => {
  // 직접적인 상태 관리
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    isAllDay: false,
    error: '',
  });

  // 수정 모드일 경우 폼 초기화
  useEffect(() => {
    if (event) {
      // 그룹 이벤트인 경우 "[그룹명]" 제외하고 표시
      let title = event.title || '';
      if (
        event.isGroupEvent &&
        event.groupName &&
        title.startsWith(`[${event.groupName}] `)
      ) {
        title = title.substring(`[${event.groupName}] `.length);
      }

      try {
        const startDate = format(new Date(event.start), 'yyyy-MM-dd\'T\'HH:mm');
        const endDate = format(new Date(event.end), 'yyyy-MM-dd\'T\'HH:mm');

        setFormData({
          title,
          start: startDate,
          end: endDate,
          description: event.description || '',
          isAllDay: event.allDay || false,
          error: '',
        });

      } catch (e) {
        // 날짜 포맷 오류 시 현재 시간으로 설정
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        setFormData({
          title,
          start: format(now, 'yyyy-MM-dd\'T\'HH:mm'),
          end: format(oneHourLater, 'yyyy-MM-dd\'T\'HH:mm'),
          description: event.description || '',
          isAllDay: false,
          error: '',
        });
      }
    } else {
      // 새 이벤트 기본값
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      setFormData({
        title: '',
        start: format(now, 'yyyy-MM-dd\'T\'HH:mm'),
        end: format(oneHourLater, 'yyyy-MM-dd\'T\'HH:mm'),
        description: '',
        isAllDay: false,
        error: '',
      });
    }
  }, [event]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      // 에러 초기화
      setFormData((prev) => ({ ...prev, error: '' }));

      // 유효성 검사
      if (!formData.title.trim()) {
        setFormData((prev) => ({ ...prev, error: '제목을 입력해주세요.' }));
        return;
      }

      const startDate = new Date(formData.start);
      const endDate = new Date(formData.end);


      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setFormData((prev) => ({
          ...prev,
          error: '유효한 날짜와 시간을 입력해주세요.',
        }));
        return;
      }

      if (startDate >= endDate) {
        setFormData((prev) => ({
          ...prev,
          error: '종료 시간은 시작 시간보다 이후여야 합니다.',
        }));
        return;
      }

      // 이벤트 데이터 구성
      const eventData = {
        ...(event ? { id: event.id } : {}),
        title: formData.title,
        start: startDate,
        end: endDate,
        description: formData.description,
        allDay: formData.isAllDay,
      };

      onSave(eventData);
    },
    [event, onSave, formData],
  );

  // 삭제 핸들러
  const handleDelete = useCallback(() => {
    if (event && onDelete) {
      onDelete(event.id);
    }
  }, [event, onDelete]);

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    setFormData({
      title: '',
      start: '',
      end: '',
      description: '',
      isAllDay: false,
      error: '',
    });
    onCancel();
  }, [onCancel]);

  // 그룹 이벤트인지 확인
  const isGroupEvent = event?.isGroupEvent || false;

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4 className="mb-0">{event ? '일정 수정' : '새 일정 추가'}</h4>
      </div>
      <div className="card-body">
        {/* 에러 메시지 */}
        {formData.error && <Alert variant="danger">{formData.error}</Alert>}

        {/* 그룹 일정 안내 */}
        {isGroupEvent && (
          <Alert variant="info">
            이 일정은 그룹 <strong>{event.groupName}</strong>의 일정입니다. 그룹
            일정은 수정할 수 없습니다.
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* 제목 입력 */}
          <Form.Group className="mb-3">
            <Form.Label>제목</Form.Label>
            <Form.Control
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, title: e.target.value }));
              }}
              disabled={isGroupEvent}
              required
            />
          </Form.Group>

          {/* 종일 체크박스 */}
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="종일"
              checked={formData.isAllDay}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  isAllDay: e.target.checked,
                }));
              }}
              disabled={isGroupEvent}
            />
          </Form.Group>

          {/* 시작 시간 */}
          <Form.Group className="mb-3">
            <Form.Label>시작 시간</Form.Label>
            <Form.Control
              type={formData.isAllDay ? 'date' : 'datetime-local'}
              value={formData.start}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, start: e.target.value }));
              }}
              disabled={isGroupEvent}
              required
            />
          </Form.Group>

          {/* 종료 시간 */}
          <Form.Group className="mb-3">
            <Form.Label>종료 시간</Form.Label>
            <Form.Control
              type={formData.isAllDay ? 'date' : 'datetime-local'}
              value={formData.end}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, end: e.target.value }));
              }}
              disabled={isGroupEvent}
              required
            />
          </Form.Group>

          {/* 설명 */}
          <Form.Group className="mb-3">
            <Form.Label>설명</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
              }}
              disabled={isGroupEvent}
            />
          </Form.Group>

          {/* 버튼 영역 */}
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={handleCancel}>
              취소
            </Button>

            <div>
              {/* 삭제 버튼 (기존 일정이고 그룹 일정이 아닐 때만) */}
              {event && !isGroupEvent && onDelete && (
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  className="me-2"
                >
                  삭제
                </Button>
              )}

              {/* 저장/수정 버튼 (그룹 일정이 아닐 때만) */}
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
