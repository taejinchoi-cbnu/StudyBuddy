import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Button, Card, Col, Container, Form, Row, Badge, Dropdown, Spinner } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { GROUP_TAGS } from '../utils/GroupConstants';
import EmailVerificationService from '../utils/EmailVerificationService';
import useNotification from '../hooks/useNotification';

// 모든 태그를 하나의 배열로 평탄화
const ALL_TAGS = Object.values(GROUP_TAGS).flat();

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile, logout, authLoading, updateEmail } = useAuth();
  const navigate = useNavigate();
  
  // 🔥 NEW: useNotification 훅 사용 (기존 error, success 상태들을 통합)
  const { 
    error, 
    success, 
    info,
    showError, 
    showSuccess, 
    showInfo,
    clearAll 
  } = useNotification();
  
  // 프로필 상태 관리
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [interests, setInterests] = useState([]);
  const [originalProfile, setOriginalProfile] = useState(null);

  // 이메일 인증 관련 상태
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // 초기 프로필 데이터 로드
  useEffect(() => {
    if (userProfile && currentUser) {
      console.log("userProfile 로드됨:", userProfile);
      console.log("certified_email 타입:", typeof userProfile.certified_email);
      console.log("certified_email 값:", userProfile.certified_email);
      
      setDisplayName(userProfile.displayName || '');
      setEmail(currentUser.email || '');
      setDepartment(userProfile.department || '');
      setInterests(userProfile.interests || []);
      setOriginalProfile({
        displayName: userProfile.displayName || '',
        email: currentUser.email || '',
        department: userProfile.department || '',
        interests: userProfile.interests || []
      });
      
      // 이메일 인증 상태 설정 - 명시적으로 불리언으로 변환
      setIsEmailVerified(userProfile.certified_email === true);
      console.log("인증 상태 설정:", userProfile.certified_email);
    }
  }, [userProfile, currentUser]);

  // 컴포넌트 마운트 시 이메일 인증 상태 확인
  useEffect(() => {
    if (currentUser?.email) {
      // userProfile에서 인증 상태 확인 (초기 로드 시)
      if (userProfile) {
        const isVerified = userProfile.certified_email === true;
        console.log("초기 인증 상태:", isVerified);
        setIsEmailVerified(isVerified);
      }
    }
  }, [currentUser?.email, userProfile]);

  // 🔥 UPDATED: 이메일 인증 상태 확인 - useNotification 훅 사용
  const checkEmailVerification = async () => {
    if (!currentUser?.email) return;
    
    try {
      setIsCheckingVerification(true);
      clearAll(); // 기존 메시지 지우기
      
      const response = await EmailVerificationService.checkVerificationStatus(currentUser.email);
      
      console.log("인증 상태 확인 응답:", response);
      
      if (response.success === true) { // 명시적으로 true와 비교
        setIsEmailVerified(true);
        showSuccess('이메일이 인증되었습니다.');
        
        // 사용자 프로필 업데이트
        await updateUserProfile({
          certified_email: true,
          certified_date: response.certified_date || new Date().toISOString()
        });
      } else {
        setIsEmailVerified(false);
        // 서버에서 인증되지 않음 메시지 전달
        if (response.message) {
          showError(response.message);
        }
      }
    } catch (error) {
      console.error("인증 상태 확인 오류:", error);
      showError(error.message || '인증 상태 확인 중 오류가 발생했습니다.');
      setIsEmailVerified(false);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  // 🔥 UPDATED: 이메일 인증 요청 - useNotification 훅 사용
  const requestEmailVerification = async () => {
    if (!email) return;
    
    try {
      setIsSendingVerification(true);
      clearAll(); // 기존 메시지 지우기
      
      // 이메일이 변경되었는지 확인
      if (email !== currentUser?.email) {
        try {
          setIsUpdatingEmail(true);
          await updateEmail(email);
          // 이메일 변경 성공 후 인증 상태 리셋
          await updateUserProfile({
            certified_email: false,
            certified_date: null
          });
          setIsEmailVerified(false);
          showSuccess('이메일이 성공적으로 변경되었습니다. 이제 인증을 진행해주세요.');
        } catch (emailError) {
          console.error('이메일 변경 오류:', emailError);
          showError('이메일 변경에 실패했습니다: ' + (emailError.message || ''));
          setIsUpdatingEmail(false);
          setIsSendingVerification(false);
          return;
        } finally {
          setIsUpdatingEmail(false);
        }
      }
      
      // API 호출
      const response = await EmailVerificationService.verifyEmail(email);
      
      // 응답 처리
      if (response.success) {
        // directVerified가 true인 경우 - 인증 완료
        if (response.directVerified) {
          setIsEmailVerified(true);
          showSuccess(response.message || '충북대학교 이메일 인증이 완료되었습니다.');
          
          // 사용자 프로필 업데이트
          await updateUserProfile({
            certified_email: true,
            certified_date: response.certified_date || new Date().toISOString()
          });
        } 
        // 이미 인증 과정이 진행 중인 경우
        else if (response.alreadySent) {
          showInfo(response.message || '이미 인증 절차가 진행 중입니다.');
          
          // 최신 상태 확인
          await checkEmailVerification();
        } 
        // 기타 성공 케이스
        else {
          showInfo(response.message || '이메일 인증 요청이 처리되었습니다.');
        }
      } else {
        // 인증 실패
        showError(response.message || '이메일 인증에 실패했습니다.');
      }
    } catch (error) {
      console.error('이메일 인증 요청 오류:', error);
      showError(error.message || '인증 이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingVerification(false);
    }
  };

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
      (!isEmailVerified && email !== originalProfile.email) || // 인증되지 않은 경우만 이메일 변경 감지
      department !== originalProfile.department ||
      JSON.stringify(interests) !== JSON.stringify(originalProfile.interests)
    );
  }, [displayName, email, department, interests, originalProfile, isEmailVerified]);

  // 로그아웃 핸들러
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      showError('로그아웃에 실패했습니다');
    }
  }, [logout, navigate, showError]);

  // 🔥 UPDATED: 프로필 업데이트 핸들러 - useNotification 훅 사용
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      clearAll(); // 기존 메시지 지우기
      
      // 폼 유효성 검사
      if (!displayName.trim()) {
        return showError('이름을 입력해주세요.');
      }
      
      // 이메일 유효성 검사
      if (!email.trim()) {
        return showError('이메일을 입력해주세요.');
      }
      
      // 변경사항이 없으면 업데이트하지 않음
      if (!hasChanges()) {
        return showError('변경사항이 없습니다.');
      }
      
      // 이메일이 변경되었고, 아직 인증되지 않은 경우
      if (!isEmailVerified && email !== currentUser?.email) {
        showError('이메일을 변경한 후에는 "이메일 인증하기" 버튼을 클릭하여 변경 및 인증을 진행해주세요.');
        return;
      }
      
      console.log("프로필 업데이트 데이터:", {
        displayName,
        department,
        interests
      });
      
      // 프로필 업데이트 - 업데이트할 필드를 명시적으로 지정
      // 이메일은 Auth 객체에서 관리되므로 여기서 업데이트하지 않음
      await updateUserProfile({
        displayName: displayName,
        department: department,
        interests: interests
      });
      
      // 업데이트 후 원본 프로필 상태 갱신
      setOriginalProfile({
        displayName,
        email: originalProfile.email,
        department,
        interests
      });
      
      showSuccess('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('Profile update error:', error);
      showError('프로필 업데이트에 실패했습니다');
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

  return (
    <>
      {/* 로딩 오버레이 추가 */}
      {(authLoading.updateProfile || authLoading.logout || isUpdatingEmail) && <LoadingSpinner />}
      
      <Container className="mt-5 mb-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <h2 className="text-center mb-4">내 프로필</h2>
                
                {/* 🔥 UPDATED: 통합된 알림 메시지 표시 */}
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                {info && <Alert variant="info">{info}</Alert>}
                
                {/* 이메일 인증 섹션 */}
                <Card className="mb-4">
                  <Card.Body>
                    <h4 className="mb-3">이메일 인증</h4>
                    
                    <div className="d-flex align-items-center mb-3">
                      <div className="me-auto">
                        <p className="mb-1">
                          <strong>이메일:</strong> {email}
                        </p>
                        <div className="mb-0">
                          <strong>인증 상태:</strong>{' '}
                          {isCheckingVerification ? (
                            <span><Spinner animation="border" size="sm" /></span>
                          ) : (
                            isEmailVerified === true ? ( // 명시적으로 true와 비교
                              <Badge bg="success">인증됨</Badge>
                            ) : (
                              <Badge bg="warning" text="dark">인증 필요</Badge>
                            )
                          )}
                        </div>
                        {isEmailVerified && userProfile?.certified_date && (
                          <p className="text-muted small mb-0">
                            인증일: {new Date(userProfile.certified_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      {!isEmailVerified && (
                        <div>
                          <Button 
                            variant="outline-primary" 
                            onClick={requestEmailVerification}
                            disabled={isSendingVerification || !email || isUpdatingEmail}
                          >
                            {isSendingVerification || isUpdatingEmail ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                처리 중...
                              </>
                            ) : (
                              '이메일 인증하기'
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {isEmailVerified && (
                        <div>
                          <Button 
                            variant="outline-success" 
                            onClick={checkEmailVerification}
                            disabled={isCheckingVerification}
                          >
                            {isCheckingVerification ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                확인 중...
                              </>
                            ) : (
                              '인증 상태 확인'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="small text-muted">
                      {!isEmailVerified ? (
                        <p className="mb-0">
                          학교 이메일 인증이 필요합니다. 인증하지 않으면 일부 기능(그룹 생성 등)이 제한될 수 있습니다.
                        </p>
                      ) : (
                        <p className="mb-0">
                          이메일이 성공적으로 인증되었습니다. 모든 기능을 사용할 수 있습니다.
                        </p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
                
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="email" className="mb-3">
                    <Form.Label>이메일</Form.Label>
                    <Form.Control 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      disabled={isEmailVerified} // 인증된 경우 이메일 변경 불가
                      required
                    />
                    <Form.Text className="text-muted">
                      {isEmailVerified 
                        ? '이메일 주소가 인증되어 변경할 수 없습니다.' 
                        : '이메일 주소를 변경한 후 인증 버튼을 클릭하세요.'}
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