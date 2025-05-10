import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner'; 

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile, logout, authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDepartment(userProfile.department || '');
      setInterests(userProfile.interests ? userProfile.interests.join(', ') : '');
    }
  }, [userProfile]);

  // 로그아웃 핸들러 수정
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('로그아웃에 실패했습니다');
    }
  };

  // 프로필 업데이트 핸들러 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      const interestsArray = interests
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      await updateUserProfile({
        displayName,
        department,
        interests: interestsArray
      });
      
      setSuccess('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('프로필 업데이트에 실패했습니다');
    }
  };

  return (
    <>
      {/* 로딩 오버레이 추가 */}
      {(authLoading.updateProfile || authLoading.logout) && <LoadingSpinner />}
      
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card>
              <Card.Body>
                <h2 className="text-center mb-4">프로필</h2>
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
                    />
                  </Form.Group>
                  
                  <Form.Group id="interests" className="mb-3">
                    <Form.Label>관심 분야 (쉼표로 구분)</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      value={interests} 
                      onChange={(e) => setInterests(e.target.value)} 
                    />
                    <Form.Text className="text-muted">
                      예시: React, Node.js, 데이터 사이언스
                    </Form.Text>
                  </Form.Group>
                  
                  <Button 
                    disabled={authLoading.updateProfile} 
                    className="w-100 mb-3" 
                    type="submit"
                  >
                    {authLoading.updateProfile ? '업데이트 중...' : '프로필 업데이트'}
                  </Button>
                </Form>
                
                <div className="w-100 text-center mt-2">
                  <Button 
                    variant="link" 
                    onClick={handleLogout} 
                    disabled={authLoading.logout}
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