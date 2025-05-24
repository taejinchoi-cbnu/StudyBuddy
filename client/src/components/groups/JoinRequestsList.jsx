import { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { approveJoinRequest, rejectJoinRequest } from '../../utils/GroupService';
import useLoading from '../../hooks/useLoading';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';

const JoinRequestsList = ({ group, currentUser, onRequestProcessed }) => {
  const { darkMode } = useDarkMode();
  const [requestProfiles, setRequestProfiles] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, startProcessing] = useLoading();
  const [processingId, setProcessingId] = useState(null); // 현재 처리 중인 요청 ID
  
  // 컴포넌트가 마운트될 때 모든 요청자의 프로필 정보를 한 번에 로드
  useEffect(() => {
    const loadAllProfiles = async () => {
      if (!group.joinRequests || group.joinRequests.length === 0) return;
      
      const profiles = {};
      const promises = group.joinRequests.map(async (request) => {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', request.uid));
          if (userDoc.exists()) {
            profiles[request.uid] = userDoc.data();
          }
        } catch (error) {
          console.error(`Error loading profile for ${request.uid}:`, error);
        }
      });
      
      await Promise.all(promises);
      setRequestProfiles(profiles);
    };
    
    loadAllProfiles();
  }, [group.joinRequests]);
  
  // 사용자 프로필 정보 불러오기 (필요시 개별 로드용)
  const loadUserProfile = async (userId) => {
    if (requestProfiles[userId]) return requestProfiles[userId];
    
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRequestProfiles(prev => ({
          ...prev,
          [userId]: userData
        }));
        return userData;
      }
      return null;
    } catch (error) {
      console.error(`Error loading user profile for ${userId}:`, error);
      return null;
    }
  };
  
  // 가입 요청 승인
  const handleApprove = async (userId) => {
    try {
      setError('');
      setSuccess('');
      setProcessingId(userId); // 처리 중인 요청 ID 설정
      
      await startProcessing(approveJoinRequest(group.id, userId, currentUser.uid));
      
      // 성공 메시지 표시
      setSuccess(`요청이 성공적으로 승인되었습니다.`);
      
      // 잠시 후 그룹 데이터 새로고침
      setTimeout(() => {
        onRequestProcessed();
      }, 1500);
    } catch (error) {
      console.error('Error approving request:', error);
      setError(`요청 승인 중 오류가 발생했습니다: ${error.message}`);
      setProcessingId(null); // 오류 시 처리 중인 요청 ID 초기화
    }
  };
  
  // 가입 요청 거절
  const handleReject = async (userId) => {
    try {
      setError('');
      setSuccess('');
      setProcessingId(userId); // 처리 중인 요청 ID 설정
      
      await startProcessing(rejectJoinRequest(group.id, userId, currentUser.uid));
      
      // 성공 메시지 표시
      setSuccess(`요청이 거절되었습니다.`);
      
      // 잠시 후 그룹 데이터 새로고침
      setTimeout(() => {
        onRequestProcessed();
      }, 1500);
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError(`요청 거절 중 오류가 발생했습니다: ${error.message}`);
      setProcessingId(null); // 오류 시 처리 중인 요청 ID 초기화
    }
  };
  
  // 가입 요청이 없는 경우
  if (!group.joinRequests || group.joinRequests.length === 0) {
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
        
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}
        
        <ListGroup>
          {group.joinRequests.map((request) => {
            // 사용자 프로필 정보 로드 (아직 로드되지 않은 경우)
            if (!requestProfiles[request.uid]) {
              loadUserProfile(request.uid);
            }
            
            const profile = requestProfiles[request.uid] || {};
            const requestDate = request.requestedAt 
              ? (request.requestedAt.toDate ? request.requestedAt.toDate() : new Date(request.requestedAt))
              : new Date();
            
            // 이 요청이 현재 처리 중인지 확인
            const isProcessingThis = processingId === request.uid;
              
            return (
              <ListGroup.Item 
                key={request.uid}
                className={`${darkMode ? 'dark-mode' : ''} ${isProcessingThis && isProcessing ? 'processing-item' : ''}`}
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
                    {isProcessingThis && isProcessing ? (
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
                          onClick={() => handleApprove(request.uid)}
                          disabled={isProcessing}
                        >
                          승인
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleReject(request.uid)}
                          disabled={isProcessing}
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