import { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { approveJoinRequest, rejectJoinRequest } from '../../utils/GroupService';
import useUIState from '../../hooks/useUIState';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';

const JoinRequestsList = ({ group = {}, currentUser, onRequestProcessed }) => {
  const { darkMode } = useDarkMode();
  const [requestProfiles, setRequestProfiles] = useState({});
  
  const ui = useUIState({
    error: "",
    success: "",
    processingRequests: new Set() // Set으로 처리 중인 요청들 관리
  });
  
  // 모든 요청자의 프로필을 한 번에 로드
  useEffect(() => {
    const loadAllProfiles = async () => {
      if (!group?.joinRequests?.length) return;
      
      const profiles = {};
      await Promise.allSettled(
        group.joinRequests.map(async (request) => {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', request.uid));
            if (userDoc.exists()) {
              profiles[request.uid] = userDoc.data();
            }
          } catch (error) {
            console.error(`Error loading profile for ${request.uid}:`, error);
          }
        })
      );
      
      setRequestProfiles(profiles);
    };
    
    loadAllProfiles();
  }, [group?.joinRequests]);
  
  // 요청 처리 핸들러 통합
  const handleRequest = async (userId, action) => {
    try {
      ui.clearAll();
      
      // 처리 중인 요청에 추가
      ui.updateState(prev => ({
        processingRequests: new Set([...prev.processingRequests, userId])
      }));
      
      if (action === 'approve') {
        await approveJoinRequest(group.id, userId, currentUser.uid);
        ui.showSuccess('요청이 승인되었습니다.');
      } else {
        await rejectJoinRequest(group.id, userId, currentUser.uid);
        ui.showSuccess('요청이 거절되었습니다.');
      }
      
      setTimeout(() => onRequestProcessed(), 1500);
      
    } catch (error) {
      ui.showError(`요청 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      // 처리 중인 요청에서 제거
      ui.updateState(prev => {
        const newSet = new Set(prev.processingRequests);
        newSet.delete(userId);
        return { processingRequests: newSet };
      });
    }
  };
  
  if (!group?.joinRequests?.length) {
    return (
      <Card className={`shadow-sm ${darkMode ? 'dark-mode' : ''}`}>
        <Card.Body>
          <h3 className="mb-3">가입 요청</h3>
          <p className="text-muted">현재 가입 요청이 없습니다.</p>
        </Card.Body>
      </Card>
    );
  }
  
  return (
    <Card className={`shadow-sm ${darkMode ? 'dark-mode' : ''}`}>
      <Card.Body>
        <h3 className="mb-3">가입 요청 ({group.joinRequests.length})</h3>
        
        {ui.error && <Alert variant="danger" onClose={() => ui.clearAll()} dismissible>{ui.error}</Alert>}
        {ui.success && <Alert variant="success" onClose={() => ui.clearAll()} dismissible>{ui.success}</Alert>}
        
        <ListGroup>
          {group.joinRequests.map((request) => {
            const profile = requestProfiles[request.uid] || {};
            const isProcessing = ui.state.processingRequests.has(request.uid);
            const requestDate = request.requestedAt 
              ? (request.requestedAt.toDate ? request.requestedAt.toDate() : new Date(request.requestedAt))
              : new Date();
              
            return (
              <ListGroup.Item 
                key={request.uid}
                className={`${darkMode ? 'dark-mode' : ''} ${isProcessing ? 'opacity-50' : ''}`}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2">
                  <div>
                    <h5 className="mb-1">{profile.displayName || '사용자'}</h5>
                    <p className="text-muted mb-1">
                      <small>요청일: {requestDate.toLocaleDateString()}</small>
                    </p>
                    {profile.department && (
                      <Badge bg="secondary" className="me-1">{profile.department}</Badge>
                    )}
                  </div>
                  
                  <div className="d-flex mt-2 mt-md-0">
                    {isProcessing ? (
                      <div className="d-flex align-items-center">
                        <Spinner animation="border" size="sm" className="me-2" />
                        <span>처리 중...</span>
                      </div>
                    ) : (
                      <>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-1"
                          onClick={() => handleRequest(request.uid, 'approve')}
                        >
                          승인
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleRequest(request.uid, 'reject')}
                        >
                          거절
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {request.message && (
                  <div className="join-request-message mt-1 p-2 bg-light rounded">
                    <small>{request.message}</small>
                  </div>
                )}
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default JoinRequestsList;