import { useState } from 'react';
import BaseModal, { ConfirmModal, DeleteModal, FormModal } from '../common/BaseModal';
import { Form } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { leaveGroup, deleteGroup } from '../../utils/GroupService';
import useUIState from '../../hooks/useUIState';

const GroupActionModal = ({ 
  show, 
  onHide, 
  type, // 'join', 'leave', 'delete'
  group, 
  userId, 
  onJoinRequest,
  onLeaveSuccess, 
  onDeleteSuccess 
}) => {
  const { darkMode } = useDarkMode();
  const [joinMessage, setJoinMessage] = useState('');
  
  const ui = useUIState({
    error: "",
    isProcessing: false
  });

  // 액션 타입별 핸들러
  const handleAction = async () => {
    try {
      ui.clearAll();
      
      switch (type) {
        case 'join':
          await onJoinRequest(joinMessage);
          setJoinMessage('');
          break;
          
        case 'leave':
          await ui.startLoading("isProcessing", async () => {
            await leaveGroup(group.id, userId);
            onLeaveSuccess();
          });
          break;
          
        case 'delete':
          await ui.startLoading("isProcessing", async () => {
            await deleteGroup(group.id, userId);
            onDeleteSuccess();
          });
          break;
      }
      
      onHide();
    } catch (error) {
      ui.showError(`작업 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 타입별 모달 설정
  const getModalConfig = () => {
    switch (type) {
      case 'join':
        return {
          title: `"${group?.name}" 그룹 가입 요청`,
          component: FormModal,
          primaryButton: { text: '요청 보내기', variant: 'primary' },
          content: (
            <>
              <p>그룹 관리자에게 가입 요청을 보냅니다.</p>
              <Form.Group className="mb-3">
                <Form.Label>가입 요청 메시지 (선택사항)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="자기소개나 그룹에 가입하려는 이유를 적어주세요."
                />
                <Form.Text className="text-muted">
                  {joinMessage.length}/300자
                </Form.Text>
              </Form.Group>
            </>
          )
        };
        
      case 'leave':
        return {
          title: '그룹 탈퇴 확인',
          component: ConfirmModal,
          primaryButton: { text: '탈퇴하기', variant: 'danger' },
          content: (
            <>
              <p>정말 "{group?.name}" 그룹에서 탈퇴하시겠습니까?</p>
              <p className="text-danger">탈퇴 후에는 관리자의 승인 없이 다시 가입할 수 없습니다.</p>
            </>
          )
        };
        
      case 'delete':
        return {
          title: '그룹 삭제 확인',
          component: DeleteModal,
          confirmationText: '삭제하기',
          primaryButton: { text: '그룹 삭제', variant: 'danger' },
          content: (
            <>
              <h5>"{group?.name}" 그룹을 정말 삭제하시겠습니까?</h5>
              <p className="text-danger">
                이 작업은 되돌릴 수 없으며, 모든 그룹 데이터와 멤버십 정보가 영구적으로 삭제됩니다.
              </p>
            </>
          )
        };
        
      default:
        return null;
    }
  };

  const config = getModalConfig();
  if (!config) return null;

  const ModalComponent = config.component;

  return (
    <ModalComponent
      show={show}
      onHide={onHide}
      title={config.title}
      error={ui.error}
      onClearMessages={() => ui.clearAll()}
      primaryButton={{
        ...config.primaryButton,
        onClick: handleAction,
        disabled: ui.isProcessing || (type === 'join' && joinMessage.length > 300)
      }}
      secondaryButton={{
        text: '취소',
        onClick: onHide
      }}
      isLoading={ui.isProcessing}
      loadingText="처리 중..."
      confirmationRequired={type === 'delete'}
      confirmationText={config.confirmationText}
      onSubmit={type === 'join' ? handleAction : undefined}
      className={`group-action-modal ${darkMode ? "dark-mode" : ""}`}
    >
      {config.content}
    </ModalComponent>
  );
};

export default GroupActionModal; 