import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { deleteGroup } from '../../utils/GroupService';
import useUIState from '../../hooks/useUIState';

const DeleteGroupModal = ({ show, onHide, group, userId, onDeleteSuccess }) => {
  const { darkMode } = useDarkMode();
  const [confirmText, setConfirmText] = useState('');
  
  // 통합 UI 상태 관리
  const ui = useUIState({
    error: "",
    isDeleting: false
  });
  
  // 확인 텍스트 초기화
  const resetForm = () => {
    setConfirmText('');
    ui.clearAll();
  };
  
  // 모달 닫기
  const handleClose = () => {
    resetForm();
    onHide();
  };
  
  // 그룹 삭제 처리
  const handleDeleteGroup = async () => {
    // 삭제 확인 텍스트 검증
    if (confirmText.trim().toLowerCase() !== '삭제하기') {
      ui.showError('삭제 확인을 위해 "삭제하기"를 정확히 입력해주세요.');
      return;
    }
    
    try {
      ui.clearAll();
      await ui.startLoading("isDeleting", async () => {
        await deleteGroup(group.id, userId);
        resetForm();
        onDeleteSuccess();
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      ui.showError(`그룹 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      centered
      className={`base-modal ${darkMode ? "dark-mode" : ""}`}
    >
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">그룹 삭제 확인</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {ui.error && <Alert variant="danger" onClose={() => ui.clearAll()} dismissible>{ui.error}</Alert>}
        
        <div className="mb-4">
          <h5>"{group?.name}" 그룹을 정말 삭제하시겠습니까?</h5>
          <p className="text-danger">이 작업은 되돌릴 수 없으며, 모든 그룹 데이터와 멤버십 정보가 영구적으로 삭제됩니다.</p>
          <p>삭제를 계속하려면 아래에 <strong>"삭제하기"</strong>를 입력하세요.</p>
        </div>
        
        <Form.Group>
          <Form.Control
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='삭제하기'
            className="mb-3"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          취소
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDeleteGroup}
          disabled={ui.isDeleting || confirmText.trim().toLowerCase() !== '삭제하기'}
        >
          {ui.isDeleting ? '처리 중...' : '그룹 삭제'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteGroupModal;