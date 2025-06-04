import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';

const JoinRequestModal = ({ show, onHide, onSubmit, group }) => {
  const { darkMode } = useDarkMode();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim().length > 300) {
      setError('메시지는 300자 이내로 작성해주세요.');
      return;
    }
    
    onSubmit(message);
    setMessage('');
    setError('');
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      className={`base-modal ${darkMode ? "dark-mode" : ""}`}
    >
      <Modal.Header closeButton>
        <Modal.Title>"{group?.name}" 그룹 가입 요청</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <p>그룹 관리자에게 가입 요청을 보냅니다.</p>
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>가입 요청 메시지 (선택사항)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="자기소개나 그룹에 가입하려는 이유를 적어주세요."
            />
            <Form.Text className="text-muted">
              {message.length}/300자
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          취소
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          요청 보내기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default JoinRequestModal;