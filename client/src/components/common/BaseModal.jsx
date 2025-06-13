import { useState } from 'react';
import { Modal, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';

//기본 모달 너무 복잡하게 만든거 같음
const BaseModal = (props) => {
  const {
    show,
    onHide,
    title,
    size,
    children,
    error,
    success,
    primaryButton,
    secondaryButton,
    isLoading,
    confirmationRequired,
    confirmationText,
    onSubmit
  } = props;
  
  const { darkMode } = useDarkMode();
  const [confirmInput, setConfirmInput] = useState('');

  //확인 텍스트 맞는지 체크
  let confirmOk = true;
  if (confirmationRequired) {
    confirmOk = confirmInput.trim().toLowerCase() === (confirmationText || '').toLowerCase();
  }

  //모달 닫기
  const handleClose = () => {
    if (isLoading) return;
    if (onHide) {
      setConfirmInput(''); //입력 초기화
      onHide();
    }
  };

  //폼 제출
  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit && confirmOk) {
      onSubmit(event);
    }
  };

  //에러/성공 메시지 렌더링
  const renderAlerts = () => {
    return (
      <>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="mb-3">
            {success}
          </Alert>
        )}
      </>
    );
  };

  //확인 입력 필드
  const renderConfirmInput = () => {
    if (!confirmationRequired) return null;
    
    return (
      <div className="mb-3">
        <p>
          입력하세요: <strong>{confirmationText}</strong>
        </p>
        <Form.Control
          type="text"
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          disabled={isLoading || false}
        />
      </div>
    );
  };

  //푸터 버튼들
  const renderFooter = () => {
    return (
      <Modal.Footer>
        {secondaryButton && (
          <Button
            variant={secondaryButton.variant ? secondaryButton.variant : 'secondary'}
            onClick={secondaryButton.onClick ? secondaryButton.onClick : handleClose}
            disabled={isLoading}
          >
            {secondaryButton.text ? secondaryButton.text : '취소'}
          </Button>
        )}

        {primaryButton && (
          <Button
            type={onSubmit ? 'submit' : 'button'}
            variant={primaryButton.variant || 'primary'}
            onClick={onSubmit ? undefined : primaryButton.onClick}
            disabled={isLoading || !confirmOk}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="me-2" />
                처리중...
              </>
            ) : (
              primaryButton.text || '확인'
            )}
          </Button>
        )}
      </Modal.Footer>
    );
  };

  //컨텐트 만들기 폼이나 일반 컨텐트
  let modalContent;
  if (onSubmit) {
    modalContent = (
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {renderAlerts()}
          {renderConfirmInput()}
          {children}
        </Modal.Body>
        {renderFooter()}
      </Form>
    );
  } else {
    modalContent = (
      <>
        <Modal.Body>
          {renderAlerts()}
          {renderConfirmInput()}
          {children}
        </Modal.Body>
        {renderFooter()}
      </>
    );
  }

  //모달 렌더링
  return (
    <Modal
      show={show || false}
      onHide={handleClose}
      size={size || 'md'}
      backdrop={isLoading ? 'static' : true}
      className={darkMode ? 'dark-mode' : ''}
    >
      <Modal.Header closeButton={!isLoading}>
        <Modal.Title>{title || '제목 없음'}</Modal.Title>
      </Modal.Header>
      {modalContent}
    </Modal>
  );
};

export default BaseModal;
