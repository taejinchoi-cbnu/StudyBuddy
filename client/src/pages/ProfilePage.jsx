import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Button, Card, Col, Container, Form, Row, Badge, Dropdown } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { GROUP_TAGS } from '../utils/GroupConstants';

// 모든 태그를 하나의 배열로 평탄화
const ALL_TAGS = Object.values(GROUP_TAGS).flat();

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile, logout, authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [interests, setInterests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [originalProfile, setOriginalProfile] = useState(null);
  const navigate = useNavigate();

  // 초기 프로필 데이터 로드
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDepartment(userProfile.department || '');
      setInterests(userProfile.interests || []);
      setOriginalProfile({
        displayName: userProfile.displayName || '',
        department: userProfile.department || '',
        interests: userProfile.interests || []
      });
    }
  }, [userProfile]);

  // 태그 추가 핸들러
  const handleAddInterest = (tag) => {
    if (!interests.includes(tag)) {
      setInterests([...interests, tag]);
    }
  };

  // 태그 제거 핸들러
  const handleRemoveInterest = (tagToRemove) => {
    setInterests(interests.filter(tag => tag !== tagToRemove));
  };

  // 데이터 변경 감지
  const hasChanges = useCallback(() => {
    if (!originalProfile) return false;
    
    return (
      displayName !== originalProfile.displayName ||
      department !== originalProfile.department ||
      JSON.stringify(interests) !== JSON.stringify(originalProfile.interests)
    );
  }, [displayName, department, interests, originalProfile]);

  // 로그아웃 핸들러
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('로그아웃에 실패했습니다');
    }
  }, [logout, navigate]);

  // 프로필 업데이트 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      // 폼 유효성 검사
      if (!displayName.trim()) {
        return setError('이름을 입력해주세요.');
      }
      
      // 변경사항이 없으면 업데이트하지 않음
      if (!hasChanges()) {
        return setError('변경사항이 없습니다.');
      }
      
      await updateUserProfile({
        displayName,
        department,
        interests
      });
      
      // 업데이트 후 원본 프로필 상태 갱신
      setOriginalProfile({
        displayName,
        department,
        interests
      });
      
      setSuccess('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('프로필 업데이트에 실패했습니다');
    }
  };

  // 프로그래밍 태그 드롭다운 렌더링
  const renderProgrammingTagsDropdown = () => (
    <Dropdown className="mb-2">
      <Dropdown.Toggle variant="outline-secondary" id="programming-tags-dropdown">
        프로그래밍 태그 추가
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {GROUP_TAGS.Programming.map(tag => (
          <Dropdown.Item 
            key={tag} 
            onClick={() => handleAddInterest(tag)}
            disabled={interests.includes(tag)}
          >
            {tag}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );

  // 디자인 태그 드롭다운 렌더링
  const renderDesignTagsDropdown = () => (
    <Dropdown className="mb-2 ms-2">
      <Dropdown.Toggle variant="outline-secondary" id="design-tags-dropdown">
        디자인 태그 추가
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {GROUP_TAGS.Design.map(tag => (
          <Dropdown.Item 
            key={tag} 
            onClick={() => handleAddInterest(tag)}
            disabled={interests.includes(tag)}
          >
            {tag}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );

  return (
    <>
      {/* 로딩 오버레이 추가 */}
      {(authLoading.updateProfile || authLoading.logout) && <LoadingSpinner />}
      
      <Container className="mt-5 mb-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <h2 className="text-center mb-4">내 프로필</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="email" className="mb-3">
                    <Form.Label>이메일</Form.Label>
                    <Form.Control 
                      type="email" 
                      value={currentUser?.email || ''} 
                      disabled 
                    />
                    <Form.Text className="text-muted">
                      이메일 주소는 변경할 수 없습니다.
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group id="displayName" className="mb-3">
                    <Form.Label>이름</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      required 
                    />
                  </Form.Group>
                  
                  <Form.Group id="department" className="mb-3">
                    <Form.Label>학과</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                      placeholder="예: 컴퓨터공학과"
                    />
                  </Form.Group>
                  
                  <Form.Group id="interests" className="mb-3">
                    <Form.Label>관심 분야</Form.Label>
                    
                    <div className="d-flex flex-wrap mb-3">
                      {interests.map((interest) => (
                        <Badge 
                          key={interest} 
                          bg="primary" 
                          className="me-1 mb-1 p-2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveInterest(interest)}
                        >
                          {interest} &times;
                        </Badge>
                      ))}
                      {interests.length === 0 && (
                        <p className="text-muted mb-0">선택된 관심 분야가 없습니다. 아래 드롭다운에서 선택해주세요.</p>
                      )}
                    </div>
                    
                    <div className="d-flex flex-wrap">
                      {renderProgrammingTagsDropdown()}
                      {renderDesignTagsDropdown()}
                    </div>
                    
                    <Form.Text className="text-muted d-block mt-2">
                      관심 분야를 선택하면 관련 스터디 그룹을 더 쉽게 찾을 수 있습니다. 태그를 클릭하면 제거됩니다.
                    </Form.Text>
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    disabled={authLoading.updateProfile || !hasChanges()} 
                    className="w-100 mb-3" 
                    type="submit"
                  >
                    {authLoading.updateProfile 
                      ? '업데이트 중...' 
                      : !hasChanges() 
                        ? '변경사항 없음' 
                        : '프로필 업데이트'}
                  </Button>
                </Form>
                
                <div className="w-100 text-center mt-3">
                  <Button 
                    variant="link" 
                    onClick={handleLogout} 
                    disabled={authLoading.logout}
                    className="text-danger"
                  >
                    {authLoading.logout ? '로그아웃 중...' : '로그아웃'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ProfilePage;