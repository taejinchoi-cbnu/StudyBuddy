import { useEffect, useCallback } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { format } from "date-fns";
import useUIState from "../../hooks/useUIState";

const EventForm = ({ event, onSave, onDelete, onCancel }) => {
  // useUIState로 통합 폼 상태 관리
  const ui = useUIState({
    // 폼 필드들
    title: "",
    start: "",
    end: "",
    description: "",
    isAllDay: false,
    
    // 에러 상태
    error: ""
  }, {
    showNotifications: true
  });

  // 수정 모드일 경우 폼 초기화
  useEffect(() => {
    console.log("🔍 EventForm useEffect, event:", event);
    
    if (event) {
      // 그룹 이벤트인 경우 "[그룹명]" 제외하고 표시
      let title = event.title || "";
      if (event.isGroupEvent && event.groupName && title.startsWith(`[${event.groupName}] `)) {
        console.log("🔍 그룹 이벤트 제목 처리");
        title = title.substring(`[${event.groupName}] `.length);
      }
      
      try {
        console.log("🔍 날짜 포맷팅 시작", event.start, event.end);
        const startDate = format(new Date(event.start), "yyyy-MM-dd'T'HH:mm");
        const endDate = format(new Date(event.end), "yyyy-MM-dd'T'HH:mm");
        
        ui.updateState({
          title,
          start: startDate,
          end: endDate,
          description: event.description || "",
          isAllDay: event.allDay || false,
          error: ""
        });
        
        console.log("🔍 날짜 포맷팅 완료", startDate, endDate);
      } catch (e) {
        console.error("🔍 날짜 포맷팅 오류:", e);
        // 날짜 포맷 오류 시 현재 시간으로 설정
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
        
        ui.updateState({
          title,
          start: format(now, "yyyy-MM-dd'T'HH:mm"),
          end: format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
          description: event.description || "",
          isAllDay: false,
          error: ""
        });
      }
    } else {
      // 새 이벤트 기본값
      console.log("🔍 새 이벤트 폼 초기화");
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + (60 * 60 * 1000));
      
      ui.updateState({
        title: "",
        start: format(now, "yyyy-MM-dd'T'HH:mm"),
        end: format(oneHourLater, "yyyy-MM-dd'T'HH:mm"),
        description: "",
        isAllDay: false,
        error: ""
      });
    }
  }, [event, ui]);
  
  // 폼 제출 핸들러
  const handleSubmit = useCallback((e) => {
    console.log("🔍 폼 제출 시작");
    e.preventDefault();
    
    // 에러 초기화
    ui.setValue("error", "");
    
    // 유효성 검사
    if (!ui.get("title").trim()) {
      console.log("🔍 제목 누락 오류");
      ui.setValue("error", "제목을 입력해주세요.");
      return;
    }
    
    const startDate = new Date(ui.get("start"));
    const endDate = new Date(ui.get("end"));
    
    console.log("🔍 날짜 유효성 검사", { startDate, endDate });
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log("🔍 유효하지 않은 날짜");
      ui.setValue("error", "유효한 날짜와 시간을 입력해주세요.");
      return;
    }
    
    if (startDate >= endDate) {
      console.log("🔍 시작 시간이 종료 시간보다 늦음");
      ui.setValue("error", "종료 시간은 시작 시간보다 이후여야 합니다.");
      return;
    }
    
    // 이벤트 데이터 구성
    const eventData = {
      ...(event ? { id: event.id } : {}),
      title: ui.get("title"),
      start: startDate,
      end: endDate,
      description: ui.get("description"),
      allDay: ui.get("isAllDay")
    };
    
    console.log("🔍 이벤트 데이터 구성 완료:", eventData);
    onSave(eventData);
  }, [event, onSave, ui]);
  
  // 삭제 핸들러
  const handleDelete = useCallback(() => {
    console.log("🔍 삭제 버튼 클릭");
    if (event && onDelete) {
      onDelete(event.id);
    }
  }, [event, onDelete]);
  
  // 취소 핸들러
  const handleCancel = useCallback(() => {
    console.log("🔍 취소 버튼 클릭");
    ui.resetState();
    onCancel();
  }, [onCancel, ui]);
  
  // 그룹 이벤트인지 확인
  const isGroupEvent = event?.isGroupEvent || false;
  console.log("🔍 그룹 이벤트 여부:", isGroupEvent);

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <h4 className="mb-0">{event ? "일정 수정" : "새 일정 추가"}</h4>
      </div>
      <div className="card-body">
        {/* 에러 메시지 */}
        {ui.get("error") && (
          <Alert variant="danger">{ui.get("error")}</Alert>
        )}
        
        {/* 그룹 일정 안내 */}
        {isGroupEvent && (
          <Alert variant="info">
            이 일정은 그룹 <strong>{event.groupName}</strong>의 일정입니다.
            그룹 일정은 수정할 수 없습니다.
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          {/* 제목 입력 */}
          <Form.Group className="mb-3">
            <Form.Label>제목</Form.Label>
            <Form.Control
              type="text"
              value={ui.get("title")}
              onChange={(e) => {
                console.log("🔍 제목 변경:", e.target.value);
                ui.setValue("title", e.target.value);
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
              checked={ui.get("isAllDay")}
              onChange={(e) => {
                console.log("🔍 종일 설정 변경:", e.target.checked);
                ui.setValue("isAllDay", e.target.checked);
              }}
              disabled={isGroupEvent}
            />
          </Form.Group>
          
          {/* 시작 시간 */}
          <Form.Group className="mb-3">
            <Form.Label>시작 시간</Form.Label>
            <Form.Control
              type={ui.get("isAllDay") ? "date" : "datetime-local"}
              value={ui.get("start")}
              onChange={(e) => {
                console.log("🔍 시작 시간 변경:", e.target.value);
                ui.setValue("start", e.target.value);
              }}
              disabled={isGroupEvent}
              required
            />
          </Form.Group>
          
          {/* 종료 시간 */}
          <Form.Group className="mb-3">
            <Form.Label>종료 시간</Form.Label>
            <Form.Control
              type={ui.get("isAllDay") ? "date" : "datetime-local"}
              value={ui.get("end")}
              onChange={(e) => {
                console.log("🔍 종료 시간 변경:", e.target.value);
                ui.setValue("end", e.target.value);
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
              value={ui.get("description")}
              onChange={(e) => {
                console.log("🔍 설명 변경");
                ui.setValue("description", e.target.value);
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
                  {event ? "수정" : "추가"}
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