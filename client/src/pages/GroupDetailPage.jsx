import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Alert, Tabs, Tab, Image } from 'react-bootstrap';
import { getGroupById, getGroupMembers, sendJoinRequest } from '../utils/GroupService';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import useLoading from '../hooks/UseLoading';
import logoQuestion from '../assets/logoQuestion.png';

// 기존 컴포넌트들 import
import GroupInfo from '../components/groups/GroupInfo';
import GroupMembersList from '../components/groups/GroupMembersList';
import JoinRequestModal from '../components/groups/JoinRequestModal';
import JoinRequestsList from '../components/groups/JoinRequestsList';
import LeaveGroupModal from '../components/groups/LeaveGroupModal';
import GroupSettings from '../components/groups/GroupSettings';
import MemberManagement from '../components/groups/MemberManagement';

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
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loadError, setLoadError] = useState(false); // 로드 오류 상태 추가
  
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
        setLoadError(false);
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
            setLoadError(true);
            setError('그룹 정보를 불러오지 못했습니다.');
            return;
          }
        } catch (groupError) {
          console.error("Error fetching group:", groupError);
          if (!isMounted) return;
          
          setLoadError(true);
          setError('그룹 정보를 불러오는 중 오류가 발생했습니다.');
          return;
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
        setLoadError(true);
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
  
  // 가입 요청 처리 후 그룹 데이터 새로고침 함수
  const reloadGroupData = async () => {
    setIsLoading(true);
    try {
      const updatedGroup = await getGroupById(groupId);
      setGroup(updatedGroup);
      
      // 멤버 정보도 다시 로드
      const updatedMembers = await getGroupMembers(groupId);
      setMembers(updatedMembers);
      
      // 현재 사용자 상태 업데이트
      if (currentUser) {
        const isMember = updatedMembers.some(member => member.userId === currentUser.uid);
        const isAdmin = updatedMembers.some(
          member => member.userId === currentUser.uid && member.role === 'admin'
        );
        
        const hasPendingRequest = updatedGroup && updatedGroup.joinRequests && 
          updatedGroup.joinRequests.some(request => request.uid === currentUser.uid);
        
        setUserStatus({ isMember, isAdmin, hasPendingRequest });
      }
      
      setSuccess('그룹 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('Error reloading group data:', error);
      setError('그룹 정보를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 가입 요청 모달 토글
  const toggleJoinModal = () => setShowJoinModal(!showJoinModal);
  
  // 탈퇴 모달 토글
  const toggleLeaveModal = () => setShowLeaveModal(!showLeaveModal);
  
  // 그룹 탈퇴 성공 처리
  const handleLeaveSuccess = () => {
    setShowLeaveModal(false);
    setSuccess('그룹에서 성공적으로 탈퇴했습니다.');
    navigate('/groups'); // 그룹 목록 페이지로 이동
  };
  
  // 그룹 삭제 성공 처리
  const handleDeleteSuccess = () => {
    setSuccess('그룹이 성공적으로 삭제되었습니다.');
    navigate('/groups'); // 그룹 목록 페이지로 이동
  };
  
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
  
  // 데이터 로드 실패 시 친절한 오류 메시지와 이미지 표시
  if (loadError || (!group && !isLoading)) {
    return (
      <Container className="mt-5">
        <Card className="shadow-sm text-center p-4">
          <Card.Body>
            <Image 
              src={logoQuestion} 
              alt="오류" 
              style={{ width: '150px', height: 'auto', margin: '0 auto 2rem' }}
              className="d-block"
            />
            <h3 className="mb-3">그룹 정보를 불러오지 못했습니다</h3>
            <p className="text-muted mb-4">
              요청하신 그룹을 찾을 수 없거나 데이터를 불러오는 도중 문제가 발생했습니다.
              <br />잠시 후 다시 시도해 주세요.
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/groups')}
              className="me-2"
            >
              그룹 목록으로 돌아가기
            </Button>
            <Button 
              variant="outline-secondary"
              onClick={() => window.location.reload()}
            >
              새로고침
            </Button>
          </Card.Body>
        </Card>
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
                      onClick={toggleLeaveModal}
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
          <GroupInfo group={group} isAdmin={userStatus.isAdmin} />
        </Tab>
        
        <Tab eventKey="members" title="멤버">
          <GroupMembersList 
            members={members} 
            isAdmin={userStatus.isAdmin}
            currentUser={currentUser} 
          />
        </Tab>
        
        {userStatus.isAdmin && (
          <Tab eventKey="settings" title="설정">
            <Row className="mt-3">
              <Col lg={6} className="mb-4">
                <GroupSettings 
                  group={group} 
                  currentUser={currentUser} 
                  onUpdateSuccess={reloadGroupData}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              </Col>
              <Col lg={6}>
                <MemberManagement 
                  group={group} 
                  members={members} 
                  currentUser={currentUser}
                  onMemberRemoved={reloadGroupData}
                />
              </Col>
            </Row>
          </Tab>
        )}
        
        {userStatus.isAdmin && group.joinRequests && group.joinRequests.length > 0 && (
          <Tab eventKey="requests" title={`가입 요청 (${group.joinRequests.length})`}>
            <JoinRequestsList 
              group={group} 
              currentUser={currentUser}
              onRequestProcessed={reloadGroupData}
            />
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
      
      {/* 그룹 탈퇴 모달 */}
      {group && currentUser && (
        <LeaveGroupModal
          show={showLeaveModal}
          onHide={toggleLeaveModal}
          group={group}
          userId={currentUser.uid}
          onLeaveSuccess={handleLeaveSuccess}
        />
      )}
    </Container>
  );
};

export default GroupDetailPage;