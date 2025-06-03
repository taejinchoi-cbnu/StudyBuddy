import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Alert, Button, Form, Badge, Dropdown, Spinner } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { GROUP_TAGS } from '../utils/GroupConstants';
import EmailVerificationService from '../utils/EmailVerificationService';
import useNotification from '../hooks/useNotification';
import useLoading from '../hooks/useLoading';

// 컴포넌트 import
import DashboardCard from '../components/common/DashboardCard';

// 모든 태그를 하나의 배열로 평탄화
const ALL_TAGS = Object.values(GROUP_TAGS).flat();

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile, logout, authLoading, updateEmail } = useAuth();
  const navigate = useNavigate();
  
  // useNotification 훅 사용
  const { 
    error, 
    success, 
    info,
    showError, 
    showSuccess, 
    showInfo,
    clearAll 
  } = useNotification();
  
  // useLoading 훅 사용 (기존 프로젝트 패턴)
  const [isUpdatingProfile, startUpdatingProfile] = useLoading();
  
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

  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);

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
      
      // 이메일 인증 상태 설정
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

  // 이메일 인증 상태 확인
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

  // 이메일 인증 요청
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

  // 편집 모드 토글
  const toggleEditMode = () => {
    if (isEditMode) {
      // 편집 취소 시 원래 값으로 복원
      if (originalProfile) {
        setDisplayName(originalProfile.displayName);
        setEmail(originalProfile.email);
        setDepartment(originalProfile.department);
        setInterests([...originalProfile.interests]);
      }
    }
    setIsEditMode(!isEditMode);
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

  // 프로필 업데이트 핸들러 - useNotification 훅 사용
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
      
      console.log("🔍 프로필 업데이트 시작:", {
        displayName,
        department,
        interests
      });
      
      // 프로필 업데이트 - 업데이트할 필드를 명시적으로 지정
      await startUpdatingProfile(updateUserProfile({
        displayName: displayName.trim(),
        department: department.trim(),
        interests: interests
      }));
      
      console.log("프로필 업데이트 성공");
      
      // 업데이트 후 원본 프로필 상태 갱신
      setOriginalProfile({
        displayName: displayName.trim(),
        email: originalProfile.email,
        department: department.trim(),
        interests: [...interests]
      });
      
      // 편집 모드 비활성화
      setIsEditMode(false);
      
      showSuccess('프로필이 성공적으로 업데이트되었습니다!');
      
      // 자동 리프레시 (2초 후) - 서버 데이터와 동기화 확인
      setTimeout(() => {
        console.log("페이지 새로고침으로 서버 데이터 동기화 확인");
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Profile update error:', error);
      showError(`프로필 업데이트에 실패했습니다: ${error.message}`);
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
    <div className="main-layout profile-page">
      {/* 로딩 오버레이 추가 */}
      {(authLoading.updateProfile || authLoading.logout || isUpdatingEmail || 
        isUpdatingProfile) && <LoadingSpinner />}
      
      {/* 네비게이션바 높이만큼 추가하는 여백 */}
      <div className="navbar-spacer"></div>
      
      <main className="main-content">
        {/* 프로필 헤더 섹션 */}
        <section className="profile-header-section">
          <h1 className="profile-main-title">내 프로필</h1>
          <p className="profile-subtitle">
            안녕하세요, {userProfile?.displayName || currentUser?.email?.split("@")[0] || "사용자"}님!
          </p>
        </section>

        {/* 프로필 카드 섹션 */}
        <section className="profile-cards-section">
          <Container className="profile-container">
            {error && <Alert variant="danger" onClose={() => clearAll()} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => clearAll()} dismissible>{success}</Alert>}
            {info && <Alert variant="info" onClose={() => clearAll()} dismissible>{info}</Alert>}
            
            <Row className="g-4">
              {/* 이메일 인증 카드 */}
              <Col lg={12}>
                <DashboardCard
                  title="이메일 인증"
                  icon="bi-envelope-check"
                  className="email-verification-card-compact"
                  headerAction={
                    isEmailVerified ? (
                      <Button 
                        variant="outline-success" 
                        size="sm"
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
                    ) : (
                      <Button 
                        variant="outline-primary" 
                        size="sm"
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
                    )
                  }
                >
                  <div className="email-verification-status">
                    <div className="me-auto">
                      <p className="mb-2">
                        <strong>이메일:</strong> {email}
                      </p>
                      <div className="verification-badge-container">
                        {isCheckingVerification ? (
                          <div className="verification-badge">
                            <Spinner animation="border" size="sm" className="me-1" />
                            확인 중...
                          </div>
                        ) : (
                          <div className={`verification-badge ${isEmailVerified ? 'verified' : 'not-verified'}`}>
                            <i className={`bi ${isEmailVerified ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1`}></i>
                            {isEmailVerified ? '인증 완료' : '인증 필요'}
                          </div>
                        )}
                      </div>
                      {isEmailVerified && userProfile?.certified_date && (
                        <p className="text-muted small mt-1 mb-0">
                          인증일: {new Date(userProfile.certified_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="small text-muted mt-2">
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
                </DashboardCard>
              </Col>

              {/* 기본 정보 카드 */}
              <Col lg={6}>
                <DashboardCard
                  title="기본 정보"
                  icon="bi-person"
                  headerAction={
                    <Button 
                      variant={isEditMode ? "outline-secondary" : "outline-primary"}
                      size="sm"
                      onClick={toggleEditMode}
                      disabled={isUpdatingProfile}
                    >
                      <i className={`bi ${isEditMode ? 'bi-x-circle' : 'bi-pencil'} me-1`}></i>
                      {isEditMode ? '취소' : '편집'}
                    </Button>
                  }
                >
                  <Form onSubmit={handleSubmit} className="profile-form-section">
                    <Form.Group className="mb-3">
                      <Form.Label>이메일</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        disabled={isEmailVerified || !isEditMode} // 편집 모드가 아니면 비활성화
                        required
                      />
                      <Form.Text className="text-muted">
                        {isEmailVerified 
                          ? '이메일 주소가 인증되어 변경할 수 없습니다.' 
                          : '이메일 주소를 변경한 후 인증 버튼을 클릭하세요.'}
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>이름</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        disabled={!isEditMode} // 편집 모드가 아니면 비활성화
                        required 
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>학과</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={department} 
                        onChange={(e) => setDepartment(e.target.value)} 
                        disabled={!isEditMode} // 편집 모드가 아니면 비활성화
                        placeholder="예: 컴퓨터공학과"
                      />
                    </Form.Group>
                    
                    {/* 편집 모드일 때만 저장 버튼 표시 */}
                    {isEditMode && (
                      <Button 
                        variant="primary"
                        disabled={isUpdatingProfile || !hasChanges()} 
                        className="profile-btn-primary w-100" 
                        type="submit"
                      >
                        {isUpdatingProfile 
                          ? '업데이트 중...' 
                          : !hasChanges() 
                            ? '변경사항 없음' 
                            : '프로필 저장'}
                      </Button>
                    )}
                  </Form>
                </DashboardCard>
              </Col>

              {/* 관심 분야 카드 */}
              <Col lg={6}>
                <DashboardCard
                  title="관심 분야"
                  icon="bi-tags"
                >
                  <div className="interests-section">
                    <Form.Label>선택된 관심 분야</Form.Label>
                    <div className="interests-display">
                      {interests.length > 0 ? (
                        interests.map((interest) => (
                          <div 
                            key={interest} 
                            className={`interest-tag ${!isEditMode ? 'disabled' : ''}`}
                            onClick={() => isEditMode && handleRemoveInterest(interest)}
                            title={isEditMode ? "클릭하여 제거" : "편집 모드에서 제거 가능"}
                          >
                            {interest}
                            {isEditMode && <span className="remove-icon">×</span>}
                          </div>
                        ))
                      ) : (
                        <div className="interests-empty">
                          선택된 관심 분야가 없습니다. {isEditMode ? '아래에서 추가해주세요.' : '편집 모드에서 추가할 수 있습니다.'}
                        </div>
                      )}
                    </div>
                    
                    {/* 편집 모드일 때만 태그 추가 드롭다운 표시 */}
                    {isEditMode && (
                      <div className="d-flex flex-wrap">
                        {renderProgrammingTagsDropdown()}
                      </div>
                    )}
                    
                    <Form.Text className="text-muted d-block mt-2">
                      관심 분야를 선택하면 관련 스터디 그룹을 더 쉽게 찾을 수 있습니다. 
                      {isEditMode ? '태그를 클릭하면 제거됩니다.' : '편집 모드에서 수정할 수 있습니다.'}
                    </Form.Text>
                  </div>
                </DashboardCard>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;