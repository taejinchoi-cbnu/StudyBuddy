import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import { getGroupById, getGroupMembers, sendJoinRequest } from '../utils/GroupService';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import useLoading from '../hooks/UseLoading';

// 간단한 그룹 정보 컴포넌트
const GroupInfo = ({ group }) => {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <h3 className="mb-3">그룹 소개</h3>
        <p className="mb-4">{group.description}</p>
        
        <h4 className="mb-2">정보</h4>
        <ul>
          <li>미팅 방식: {group.meetingType}</li>
          <li>최대 인원: {group.maxMembers}명</li>
          <li>현재 인원: {group.memberCount || 1}명</li>
        </ul>
      </Card.Body>
    </Card>
  );
};

// 가입 요청 모달 컴포넌트
const JoinRequestModal = ({ show, onHide, onSubmit, group }) => {
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
    <Modal show={show} onHide={onHide} centered>
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

// 멤버 목록 컴포넌트
const GroupMembersList = ({ members, currentUser }) => {
  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <h3 className="mb-3">멤버 ({members.length})</h3>
        
        {members.length > 0 ? (
          <div className="list-group">
            {members.map((member) => (
              <div 
                key={member.userId}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{member.userId}</strong>
                  {currentUser && member.userId === currentUser.uid && <span className="ms-2">(나)</span>}
                </div>
                
                <Badge bg={member.role === 'admin' ? 'danger' : 'info'}>
                  {member.role === 'admin' ? '관리자' : '멤버'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">멤버 정보를 불러오는 중이거나 멤버가 없습니다.</p>
        )}
      </Card.Body>
    </Card>
  );
};

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, startJoiningLoading] = useLoading();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  // 현재 사용자의 그룹 멤버십 상태
  const [userStatus, setUserStatus] = useState({
    isMember: false,
    isAdmin: false,
    hasPendingRequest: false
  });
  
  // 그룹 및 멤버 정보 로드
  useEffect(() => {
    let isMounted = true;
    
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching group data for ID:", groupId);
        
        // 그룹 정보 가져오기 시도
        let groupData;
        try {
          groupData = await getGroupById(groupId);
          console.log("Group data:", groupData);
          
          if (!isMounted) return;
          if (groupData) {
            setGroup(groupData);
          } else {
            // 임시 데이터 사용
            setGroup({
              id: groupId,
              name: '데이터 로드 실패 (임시 데이터)',
              description: '그룹 정보를 불러오지 못했습니다.',
              subject: ['Test'],
              tags: ['Test'],
              maxMembers: 10,
              memberCount: 1,
              meetingType: '알 수 없음',
              createdAt: new Date(),
              joinRequests: []
            });
          }
        } catch (groupError) {
          console.error("Error fetching group:", groupError);
          if (!isMounted) return;
          
          // 임시 데이터 사용
          setGroup({
            id: groupId,
            name: '데이터 로드 실패 (임시 데이터)',
            description: '그룹 정보를 불러오지 못했습니다.',
            subject: ['Test'],
            tags: ['Test'],
            maxMembers: 10,
            memberCount: 1,
            meetingType: '알 수 없음',
            createdAt: new Date(),
            joinRequests: []
          });
        }
        
        // 그룹 멤버 정보 가져오기
        try {
          const membersData = await getGroupMembers(groupId);
          console.log("Members data:", membersData);
          
          if (!isMounted) return;
          if (membersData && Array.isArray(membersData)) {
            setMembers(membersData);
            
            // 현재 사용자의 상태 확인
            if (currentUser) {
              const isMember = membersData.some(member => member.userId === currentUser.uid);
              const isAdmin = membersData.some(
                member => member.userId === currentUser.uid && member.role === 'admin'
              );
              
              // 가입 요청 확인
              const hasPendingRequest = groupData && groupData.joinRequests && 
                groupData.joinRequests.some(request => request.uid === currentUser.uid);
              
              setUserStatus({ isMember, isAdmin, hasPendingRequest });
            }
          } else {
            setMembers([]);
          }
        } catch (membersError) {
          console.error("Error fetching members:", membersError);
          if (!isMounted) return;
          setMembers([]);
        }
        
      } catch (error) {
        console.error('Error in fetchGroupData:', error);
        if (!isMounted) return;
        setError('그룹 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    if (groupId) {
      fetchGroupData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [groupId, currentUser]);
  
  // 가입 요청 모달 토글
  const toggleJoinModal = () => setShowJoinModal(!showJoinModal);
  
  // 가입 요청 제출
  const handleJoinRequest = async (message) => {
    try {
      await startJoiningLoading(sendJoinRequest(groupId, currentUser.uid, message));
      setSuccess('가입 요청이 성공적으로 전송되었습니다.');
      setUserStatus({ ...userStatus, hasPendingRequest: true });
      setShowJoinModal(false);
    } catch (error) {
      console.error('Error sending join request:', error);
      setError('가입 요청 중 오류가 발생했습니다: ' + error.message);
    }
  };
  
  if (isLoading) {
    return (
      <Container className="text-center py-5">
        <LoadingSpinner />
        <p className="mt-3">그룹 정보를 불러오는 중...</p>
      </Container>
    );
  }
  
  if (!group && !isLoading) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          그룹을 찾을 수 없습니다. <Link to="/groups">그룹 목록으로 돌아가기</Link>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className={`mt-4 ${darkMode ? 'dark-mode' : ''}`}>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      
      <div className="mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/groups')}
          className="mb-3"
        >
          ← 그룹 목록으로
        </Button>
        
        <Card className="shadow-sm">
          <Card.Body>
            <Row>
              <Col md={8}>
                <h1>{group.name}</h1>
                
                <div className="mb-3">
                  {group.subject && Array.isArray(group.subject) && group.subject.map(subject => (
                    <Badge 
                      key={subject} 
                      bg="primary" 
                      className="me-1 mb-1 p-2"
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
                
                <div className="mb-3">
                  {group.tags && Array.isArray(group.tags) && group.tags.map(tag => (
                    <Badge 
                      key={tag} 
                      bg="secondary" 
                      className="me-1 mb-1"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-muted">
                  미팅 방식: {group.meetingType} | 
                  인원: {group.memberCount || 1}/{group.maxMembers} |
                  생성일: {group.createdAt ? (
                    typeof group.createdAt.toDate === 'function' 
                      ? group.createdAt.toDate().toLocaleDateString() 
                      : new Date(group.createdAt).toLocaleDateString()
                  ) : '날짜 정보 없음'}
                </p>
              </Col>
              
              <Col md={4} className="d-flex align-items-center justify-content-end">
                {!userStatus.isMember && !userStatus.hasPendingRequest && (
                  <Button 
                    variant="primary" 
                    onClick={toggleJoinModal}
                    disabled={isJoining}
                    className="w-100"
                  >
                    {isJoining ? '처리 중...' : '가입 요청하기'}
                  </Button>
                )}
                
                {userStatus.hasPendingRequest && (
                  <Button 
                    variant="outline-primary" 
                    disabled
                    className="w-100"
                  >
                    가입 요청 대기 중
                  </Button>
                )}
                
                {userStatus.isMember && (
                  <div className="text-center w-100">
                    <Badge bg="success" className="p-2 mb-2">그룹 멤버</Badge>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="w-100"
                      // 그룹 탈퇴 기능 추가 (향후 구현)
                    >
                      그룹 탈퇴
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
      
      <Tabs defaultActiveKey="info" className="mb-4">
        <Tab eventKey="info" title="그룹 정보">
          <GroupInfo group={group} />
        </Tab>
        
        <Tab eventKey="members" title="멤버">
          <GroupMembersList 
            members={members} 
            currentUser={currentUser} 
          />
        </Tab>
        
        {userStatus.isAdmin && group.joinRequests && group.joinRequests.length > 0 && (
          <Tab eventKey="requests" title={`가입 요청 (${group.joinRequests.length})`}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h3 className="mb-3">가입 요청</h3>
                <p>가입 요청 관리 기능은 아직 구현되지 않았습니다.</p>
              </Card.Body>
            </Card>
          </Tab>
        )}
      </Tabs>
      
      {/* 가입 요청 모달 */}
      <JoinRequestModal 
        show={showJoinModal} 
        onHide={toggleJoinModal} 
        onSubmit={handleJoinRequest}
        group={group}
      />
    </Container>
  );
};

export default GroupDetailPage;