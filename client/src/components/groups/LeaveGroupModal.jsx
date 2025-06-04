import { useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { leaveGroup } from '../../utils/GroupService';
import useUIState from '../../hooks/useUIState';

const LeaveGroupModal = ({ show, onHide, group, userId, onLeaveSuccess }) => {
  const { darkMode } = useDarkMode();
  
  // 통합 UI 상태 관리
  const ui = useUIState({
    error: "",
    isLeaving: false
  });
  
  const handleLeaveGroup = async () => {
    try {
      ui.clearAll();
      await ui.startLoading("isLeaving", async () => {
        await leaveGroup(group.id, userId);
        onLeaveSuccess();
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      
      // 관리자 탈퇴 시 표시할 특별 메시지
      if (error.message && error.message.includes('Admin cannot leave')) {
        ui.showError('관리자는 그룹에서 탈퇴할 수 없습니다. 먼저 다른 멤버에게 관리자 권한을 양도해야 합니다.');
      } else {
        ui.showError(`그룹 탈퇴 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      className={`base-modal ${darkMode ? "dark-mode" : ""}`}
    >
      <Modal.Header closeButton>
        <Modal.Title>그룹 탈퇴 확인</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {ui.error && <Alert variant="danger" onClose={() => ui.clearAll()} dismissible>{ui.error}</Alert>}
        
        <p>정말 "{group?.name}" 그룹에서 탈퇴하시겠습니까?</p>
        <p className="text-danger">탈퇴 후에는 관리자의 승인 없이 다시 가입할 수 없습니다.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          취소
        </Button>
        <Button 
          variant="danger" 
          onClick={handleLeaveGroup}
          disabled={ui.isLeaving}
        >
          {ui.isLeaving ? '처리 중...' : '탈퇴하기'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LeaveGroupModal;