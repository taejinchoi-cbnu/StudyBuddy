import { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Badge, Alert, Modal } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { removeMember } from '../../utils/GroupService';
import useLoading from '../../hooks/useLoading';

const MemberManagement = ({ group, members, currentUser, onMemberRemoved }) => {
  const { darkMode } = useDarkMode();
  const [memberProfiles, setMemberProfiles] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRemoving, startRemoving] = useLoading();
  
  // 사용자 프로필 정보 로드
  useEffect(() => {
    const loadProfiles = async () => {
      const profiles = {};
      
      for (const member of members) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', member.userId));
          if (userDoc.exists()) {
            profiles[member.userId] = userDoc.data();
          }
        } catch (error) {
          console.error(`Error loading profile for ${member.userId}:`, error);
        }
      }
      
      setMemberProfiles(profiles);
    };
    
    if (members.length > 0) {
      loadProfiles();
    }
  }, [members]);
  
  // 회원 제거 확인 모달 열기
  const openRemoveConfirm = (member) => {
    setSelectedMember(member);
    setShowConfirmModal(true);
  };
  
  // 회원 제거 확인 모달 닫기
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setSelectedMember(null);
  };
  
  // 회원 제거 처리
  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      setError('');
      
      // 회원 제거 API 호출
      await startRemoving(removeMember(group.id, selectedMember.userId, currentUser.uid));
      
      setSuccess(`${memberProfiles[selectedMember.userId]?.displayName || '사용자'}가 그룹에서 제거되었습니다.`);
      closeConfirmModal();
      
      // 부모 컴포넌트에 알림
      onMemberRemoved(selectedMember.userId);
    } catch (error) {
      console.error('Error removing member:', error);
      setError('회원 제거 중 오류가 발생했습니다: ' + error.message);
      closeConfirmModal();
    }
  };
  
  return (
    <>
      <Card className={`shadow-sm ${darkMode ? 'dark-mode' : ''}`}>
        <Card.Body>
          <h3 className="mb-3">멤버 관리</h3>
          
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <ListGroup>
            {members.map((member) => {
              const profile = memberProfiles[member.userId] || {};
              const isCurrentUser = currentUser && member.userId === currentUser.uid;
              
              return (
                <ListGroup.Item 
                  key={member.userId}
                  className={`d-flex justify-content-between align-items-center ${darkMode ? 'dark-mode' : ''}`}
                >
                  <div>
                    <div className="d-flex align-items-center">
                      <strong>{profile.displayName || '사용자'}</strong>
                      {isCurrentUser && <span className="ms-2">(나)</span>}
                      <Badge 
                        bg={member.role === 'admin' ? 'danger' : 'info'} 
                        className="ms-2"
                      >
                        {member.role === 'admin' ? '관리자' : '멤버'}
                      </Badge>
                    </div>
                    
                    <small className="text-muted d-block">
                      {member.joinedAt ? new Date(member.joinedAt.seconds * 1000).toLocaleDateString() : '날짜 정보 없음'}에 가입
                    </small>
                    
                    {profile.department && (
                      <small className="text-muted d-block">{profile.department}</small>
                    )}
                  </div>
                  
                  <div>
                    {!isCurrentUser && member.role !== 'admin' && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => openRemoveConfirm(member)}
                      >
                        제거
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card.Body>
      </Card>
      
      {/* 회원 제거 확인 모달 */}
      <Modal 
        show={showConfirmModal} 
        onHide={closeConfirmModal}
        centered
        className={darkMode ? 'dark-mode' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title>회원 제거 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            정말 <strong>{selectedMember ? (memberProfiles[selectedMember.userId]?.displayName || '이 사용자') : ''}</strong>를 
            그룹에서 제거하시겠습니까?
          </p>
          <p className="text-danger">이 작업은 되돌릴 수 없습니다.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirmModal}>
            취소
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRemoveMember}
            disabled={isRemoving}
          >
            {isRemoving ? '처리 중...' : '제거하기'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MemberManagement;