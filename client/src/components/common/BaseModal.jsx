import { useState } from "react";
import { Modal, Button, Alert, Spinner, Form } from "react-bootstrap";
import { useDarkMode } from "../../contexts/DarkModeContext";

// 통합 모달 컴포넌트 - 모든 모달을 하나로 통합
const BaseModal = ({
  // 기본 모달 속성
  show,
  onHide,
  title,
  size = "md", // "sm", "md", "lg", "xl"
  centered = true,
  
  // 헤더 설정
  showCloseButton = true,
  headerIcon,
  headerVariant = "default", // "default", "danger", "warning", "success", "info"
  
  // 콘텐츠
  children,
  
  // 알림 메시지
  error,
  success,
  info,
  onClearMessages,
  
  // 푸터 버튼 설정
  showFooter = true,
  primaryButton,
  secondaryButton,
  customFooter,
  
  // 로딩 상태
  isLoading = false,
  loadingText = "처리 중...",
  
  // 확인 입력 (삭제 모달 등에서 사용)
  confirmationRequired = false,
  confirmationText = "",
  confirmationPlaceholder = "확인 텍스트를 입력하세요",
  onConfirmationChange,
  
  // 폼 처리
  onSubmit,
  
  // 추가 props
  className = "",
  backdrop = true,
  keyboard = true,
  ...props
}) => {
  const { darkMode } = useDarkMode();
  const [internalConfirmText, setInternalConfirmText] = useState("");
  
  // 확인 텍스트 변경 핸들러
  const handleConfirmationChange = (e) => {
    const value = e.target.value;
    setInternalConfirmText(value);
    if (onConfirmationChange) {
      onConfirmationChange(value);
    }
  };
  
  // 확인 텍스트 검증
  const isConfirmationValid = () => {
    if (!confirmationRequired) return true;
    return internalConfirmText.trim().toLowerCase() === confirmationText.toLowerCase();
  };
  
  // 헤더 아이콘 및 스타일 결정
  const getHeaderStyle = () => {
    switch (headerVariant) {
      case "danger":
        return { titleClass: "text-danger", iconClass: headerIcon || "bi-exclamation-triangle" };
      case "warning":
        return { titleClass: "text-warning", iconClass: headerIcon || "bi-exclamation-circle" };
      case "success":
        return { titleClass: "text-success", iconClass: headerIcon || "bi-check-circle" };
      case "info":
        return { titleClass: "text-info", iconClass: headerIcon || "bi-info-circle" };
      default:
        return { titleClass: "", iconClass: headerIcon };
    }
  };
  
  const headerStyle = getHeaderStyle();
  
  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && (!confirmationRequired || isConfirmationValid())) {
      onSubmit(e);
    }
  };
  
  // 모달 닫기 핸들러 (로딩 중이 아닐 때만)
  const handleHide = () => {
    if (!isLoading && onHide) {
      setInternalConfirmText(""); // 확인 텍스트 초기화
      onHide();
    }
  };
  
  // 알림 메시지 렌더링
  const renderAlerts = () => {
    return (
      <>
        {error && (
          <Alert 
            variant="danger" 
            onClose={onClearMessages} 
            dismissible={!!onClearMessages}
            className="mb-3"
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            variant="success" 
            onClose={onClearMessages} 
            dismissible={!!onClearMessages}
            className="mb-3"
          >
            {success}
          </Alert>
        )}
        {info && (
          <Alert 
            variant="info" 
            onClose={onClearMessages} 
            dismissible={!!onClearMessages}
            className="mb-3"
          >
            {info}
          </Alert>
        )}
      </>
    );
  };
  
  // 확인 입력 필드 렌더링
  const renderConfirmationInput = () => {
    if (!confirmationRequired) return null;
    
    return (
      <div className="mb-3">
        <p className="mb-2">
          계속하려면 <strong>"{confirmationText}"</strong>를 정확히 입력하세요.
        </p>
        <Form.Control
          type="text"
          value={internalConfirmText}
          onChange={handleConfirmationChange}
          placeholder={confirmationPlaceholder}
          disabled={isLoading}
          className={!isConfirmationValid() && internalConfirmText ? "is-invalid" : ""}
        />
        {!isConfirmationValid() && internalConfirmText && (
          <div className="invalid-feedback">
            입력한 텍스트가 일치하지 않습니다.
          </div>
        )}
      </div>
    );
  };
  
  // 기본 푸터 렌더링
  const renderDefaultFooter = () => {
    if (!showFooter) return null;
    
    if (customFooter) {
      return <Modal.Footer>{customFooter}</Modal.Footer>;
    }
    
    return (
      <Modal.Footer>
        {/* 보조 버튼 (취소, 닫기 등) */}
        {secondaryButton && (
          <Button
            variant={secondaryButton.variant || "secondary"}
            onClick={secondaryButton.onClick || handleHide}
            disabled={isLoading}
            className={secondaryButton.className || ""}
          >
            {secondaryButton.icon && <i className={`${secondaryButton.icon} me-1`}></i>}
            {secondaryButton.text || "취소"}
          </Button>
        )}
        
        {/* 주 버튼 (확인, 삭제, 저장 등) */}
        {primaryButton && (
          <Button
            type={onSubmit ? "submit" : "button"}
            variant={primaryButton.variant || "primary"}
            onClick={!onSubmit ? primaryButton.onClick : undefined}
            disabled={
              isLoading || 
              (confirmationRequired && !isConfirmationValid()) ||
              primaryButton.disabled
            }
            className={primaryButton.className || ""}
          >
            {isLoading ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  role="status" 
                  aria-hidden="true" 
                  className="me-2"
                />
                {loadingText}
              </>
            ) : (
              <>
                {primaryButton.icon && <i className={`${primaryButton.icon} me-1`}></i>}
                {primaryButton.text || "확인"}
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    );
  };
  
  // 모달 콘텐츠 렌더링
  const renderModalContent = () => {
    if (onSubmit) {
      return (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {renderAlerts()}
            {renderConfirmationInput()}
            {children}
          </Modal.Body>
          {renderDefaultFooter()}
        </Form>
      );
    }
    
    return (
      <>
        <Modal.Body>
          {renderAlerts()}
          {renderConfirmationInput()}
          {children}
        </Modal.Body>
        {renderDefaultFooter()}
      </>
    );
  };
  
  return (
    <Modal
      show={show}
      onHide={handleHide}
      size={size}
      centered={centered}
      backdrop={isLoading ? "static" : backdrop}
      keyboard={!isLoading && keyboard}
      className={`base-modal ${darkMode ? "dark-mode" : ""} ${className}`}
      {...props}
    >
      {/* 모달 헤더 */}
      <Modal.Header closeButton={showCloseButton && !isLoading}>
        <Modal.Title className={headerStyle.titleClass}>
          {headerStyle.iconClass && (
            <i className={`${headerStyle.iconClass} me-2`}></i>
          )}
          {title}
        </Modal.Title>
      </Modal.Header>
      
      {/* 모달 콘텐츠 */}
      {renderModalContent()}
    </Modal>
  );
};

// 자주 사용되는 모달 프리셋들

// 확인 모달: 간단한 예/아니오 확인용
export const ConfirmModal = (props) => (
  <BaseModal
    headerVariant="warning"
    primaryButton={{
      variant: "warning",
      text: "확인",
      icon: "bi-check-lg",
      ...props.primaryButton
    }}
    secondaryButton={{
      variant: "secondary",
      text: "취소",
      icon: "bi-x-lg",
      ...props.secondaryButton
    }}
    {...props}
  />
);

// 삭제 확인 모달: 삭제 작업 시 사용
export const DeleteModal = (props) => (
  <BaseModal
    headerVariant="danger"
    confirmationRequired={true}
    confirmationText="삭제하기"
    confirmationPlaceholder="삭제하기"
    primaryButton={{
      variant: "danger",
      text: "삭제",
      icon: "bi-trash",
      ...props.primaryButton
    }}
    secondaryButton={{
      variant: "secondary",
      text: "취소",
      icon: "bi-x-lg",
      ...props.secondaryButton
    }}
    {...props}
  />
);

// 정보 모달 단순 정보 표시
export const InfoModal = (props) => (
  <BaseModal
    headerVariant="info"
    showFooter={false}
    showCloseButton={true}
    {...props}
  />
);

// 폼 모달 - 폼 입력이 있는 모달
export const FormModal = (props) => (
  <BaseModal
    primaryButton={{
      variant: "primary",
      text: "저장",
      icon: "bi-check-lg",
      ...props.primaryButton
    }}
    secondaryButton={{
      variant: "secondary",
      text: "취소",
      icon: "bi-x-lg",
      ...props.secondaryButton
    }}
    {...props}
  />
);

// 경고 모달 - 중요한 경고 메시지용
export const WarningModal = (props) => (
  <BaseModal
    headerVariant="warning"
    primaryButton={{
      variant: "warning",
      text: "계속",
      icon: "bi-exclamation-triangle",
      ...props.primaryButton
    }}
    secondaryButton={{
      variant: "secondary",
      text: "취소",
      icon: "bi-x-lg",
      ...props.secondaryButton
    }}
    {...props}
  />
);

// 성공 모달 - 성공 메시지 표시용
export const SuccessModal = (props) => (
  <BaseModal
    headerVariant="success"
    primaryButton={{
      variant: "success",
      text: "확인",
      icon: "bi-check-lg",
      ...props.primaryButton
    }}
    showFooter={true}
    {...props}
  />
);

export default BaseModal;