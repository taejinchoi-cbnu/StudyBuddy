import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import LoadingSpinner from './LoadingSpinner'; 
import logoSmall from '../assets/logoSmall.png';
import EmailVerificationService from '../utils/EmailVerificationService';
import { saveTempUserData, getTempUserData, clearTempUserData } from '../utils/TempStorage';

const AppNavbar = forwardRef(({ transparent = false }, ref) => {
  // 컨텍스트 훅 사용
  const { currentUser, logout, login, signup, resetPassword, updateUserProfile, authLoading, clearTempUserData } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 모달 상태 관리
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // 폼 상태 관리
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(''); // 성공 메시지 추가
  
  // 인증번호 관련 상태
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationTimer, setVerificationTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [tempUserData, setTempUserData] = useState(null);
  
  // ref를 통해 외부에서 접근 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    handleLoginModalOpen,
    handleSignupModalOpen,
    handleForgotPasswordModalOpen
  }));
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 타이머 정리
      clearVerificationTimer();
      
      // 오래된 임시 데이터 정리
      const userData = getTempUserData();
      if (!userData) {
        // 이미 정리되었거나 만료됨
        return;
      }
    };
  }, []);
  
  // 타이머 관리 함수들
  const startVerificationTimer = () => {
    // 10분 타이머 설정 (600초)
    setVerificationTimer(600);
    const interval = setInterval(() => {
      setVerificationTimer(prevTimer => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    // interval ID 저장 (정리 용도)
    window.verificationTimerInterval = interval;
  };

  const clearVerificationTimer = () => {
    if (window.verificationTimerInterval) {
      clearInterval(window.verificationTimerInterval);
    }
  };
  
  // 타이머 형식화 함수
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 모달 핸들러
  const handleLoginModalOpen = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    
    // 오래된 임시 데이터 정리
    const userData = getTempUserData();
    // getTempUserData 함수 내부에서 만료된 데이터 처리
    
    setShowLoginModal(true);
  };
  
  const handleSignupModalOpen = () => {
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setDisplayName('');
    setShowSignupModal(true);
  };
  
  const handleForgotPasswordModalOpen = () => {
    setError('');
    setMessage('');
    setEmail('');
    setShowForgotPasswordModal(true);
  };
  
  const handleLoginModalClose = () => {
    setError('');
    setSuccess('');
    setShowLoginModal(false);
  };
  
  const handleSignupModalClose = () => {
    setError('');
    setSuccess('');
    setShowSignupModal(false);
  };
  
  const handleForgotPasswordModalClose = () => {
    setError('');
    setSuccess('');
    setMessage('');
    setShowForgotPasswordModal(false);
  };
  
  const handleCloseVerificationModal = () => {
    // 임시 데이터 삭제
    clearTempUserData();
    setTempUserData(null);
    setShowVerificationModal(false);
    // 타이머 중지
    clearVerificationTimer();
  };
  
  const handleSwitchToSignup = () => {
    handleLoginModalClose();
    setError('');
    setSuccess('');
    handleSignupModalOpen();
  };
  
  const handleSwitchToLogin = () => {
    handleSignupModalClose();
    setError('');
    setSuccess('');
    handleLoginModalOpen();
  };
  
  const handleSwitchToForgotPassword = () => {
    handleLoginModalClose();
    setError('');
    setSuccess('');
    handleForgotPasswordModalOpen();
  };
  
  // 로그인 핸들러 수정
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      await login(email, password);
      handleLoginModalClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    }
  };
  
  // 회원가입 핸들러 수정
  const handleSignup = async (e) => {
    e.preventDefault();
    
    console.log("회원가입 시도:", { email, password, displayName });
    
    // 잘못된 입력 검증
    if (password !== passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }
    
    if (password.length < 6) {
      return setError('비밀번호는 최소 6자 이상이어야 합니다.');
    }
    
    try {
      setError('');
      console.log("이메일 인증 요청 준비");
      
      // 이메일 인증번호 요청
      try {
        // 임시 사용자 데이터 저장 - TempStorage 유틸리티 사용
        const tempData = {
          email: email,
          password: password,
          displayName: displayName
        };
        
        const saveResult = saveTempUserData(tempData);
        if (!saveResult) {
          throw new Error('임시 데이터 저장에 실패했습니다.');
        }
        
        // 임시 데이터 상태 업데이트
        setTempUserData(tempData);
        
        // 인증번호 요청 (EmailVerificationService 활용)
        const response = await EmailVerificationService.requestVerificationCode(email);
        
        if (response.success) {
          // 이미 인증된 이메일인 경우 (directVerified가 true인 경우)
          if (response.directVerified) {
            console.log("이미 인증된 이메일:", email);
            
            try {
              // 계정 생성 직행
              const userCredential = await signup(
                email,
                password,
                displayName,
                true, // 인증됨
                response.certified_date || new Date().toISOString()
              );
              
              if (userCredential) {
                // 임시 데이터 삭제
                clearTempUserData();
                setTempUserData(null);
                
                // 성공 메시지 표시
                setSuccess('이미 인증된 이메일입니다. 회원가입이 완료되었습니다.');
                
                // 잠시 후 리디렉션
                setTimeout(() => {
                  setShowSignupModal(false);
                  navigate('/dashboard');
                }, 1500);
              }
            } catch (signupError) {
              console.error('계정 생성 오류:', signupError);
              // 오류 메시지 설정
              setError('계정 생성 중 오류가 발생했습니다: ' + (signupError.message || '알 수 없는 오류'));
              
              // 임시 데이터 정리
              clearTempUserData();
              setTempUserData(null);
            }
          } 
          // 일반적인 경우 - 인증번호 입력 모달 표시
          else {
            setShowSignupModal(false);
            setShowVerificationModal(true);
            startVerificationTimer();
            setVerificationCode('');
            setCodeError('');
          }
        } else {
          throw new Error(response.message || '인증번호 발송에 실패했습니다.');
        }
      } catch (verificationError) {
        console.error('이메일 인증 요청 오류:', verificationError);
        // 임시 데이터 삭제
        clearTempUserData();
        setTempUserData(null);
        
        setError('이메일 인증 요청에 실패했습니다: ' + verificationError.message);
      }
    } catch (error) {
      console.error('회원가입 준비 오류:', error);
      setError('회원가입 중 오류가 발생했습니다: ' + error.message);
    }
  };
  
  // 인증번호 검증 및 최종 회원가입 처리
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      return setCodeError('인증번호를 입력해주세요.');
    }
    
    try {
      setIsVerifying(true);
      setCodeError('');
      
      // 임시 데이터 가져오기 - TempStorage 유틸리티 사용
      const userData = getTempUserData();
      
      if (!userData) {
        throw new Error('임시 데이터를 찾을 수 없습니다. 다시 시도해주세요.');
      }
      
      // 인증번호 검증
      const verifyResponse = await EmailVerificationService.verifyCode(userData.email, verificationCode);
      
      if (verifyResponse.success) {
        // 인증 성공 - Firebase 계정 생성 (이메일 인증 상태 및 인증 날짜 추가)
        const userCredential = await signup(
          userData.email, 
          userData.password, 
          userData.displayName, 
          true, // 이메일 인증됨
          verifyResponse.certified_date // 인증 날짜
        );
        
        if (userCredential) {
          // 임시 데이터 삭제
          clearTempUserData();
          setTempUserData(null);
          
          // 모달 닫기 및 리디렉션
          setShowVerificationModal(false);
          navigate('/dashboard');
        }
      } else {
        throw new Error(verifyResponse.message || '인증번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('인증번호 검증 오류:', error);
      setCodeError(error.message || '인증 과정에서 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // 인증번호 재발송
  const handleResendCode = async () => {
    if (!tempUserData) {
      return setCodeError('회원 정보를 찾을 수 없습니다. 다시 시도해주세요.');
    }
    
    try {
      setIsVerifying(true);
      setCodeError('');
      
      // 인증번호 재요청
      const response = await EmailVerificationService.requestVerificationCode(tempUserData.email);
      
      if (response.success) {
        // 타이머 재시작
        clearVerificationTimer();
        startVerificationTimer();
        setCodeError('');
        // 성공 메시지
        setCodeError('인증번호가 재발송되었습니다.');
        setTimeout(() => setCodeError(''), 3000);
      } else {
        throw new Error(response.message || '인증번호 재발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('인증번호 재발송 오류:', error);
      setCodeError(error.message || '인증번호 재발송 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // 비밀번호 재설정 핸들러 수정
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    try {
      setMessage('');
      setError('');
      await resetPassword(email);
      setMessage('이메일로 비밀번호 재설정 안내가 발송되었습니다.');
      setTimeout(() => {
        handleForgotPasswordModalClose();
        handleLoginModalOpen();
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError('비밀번호 재설정에 실패했습니다. 이메일 주소를 확인해주세요.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 홈페이지일 경우 투명한 배경에 흐릿한 흰색 배경 추가
  const isHomePage = location.pathname === '/';
  const navbarClass = `dashboard-navbar ${darkMode ? 'dark-mode' : ''} ${
    transparent && isHomePage ? 'transparent-navbar home-navbar' : ''
  }`;

  return (
    <>
      {/* 로딩 오버레이 추가 */}
      {(authLoading.login || authLoading.signup || authLoading.resetPassword) && <LoadingSpinner />}
      
      <Navbar 
        variant={transparent && !darkMode && isHomePage ? "light" : "dark"} 
        expand="lg" 
        className={navbarClass} 
        fixed="top"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center navbar-brand-container">
            <img
              src={logoSmall}
              alt="StudyBuddy Logo"
              height="30"
              className="d-inline-block align-top me-2"
            />
            <span className="fw-bold" style={{ fontFamily: 'Poor Story, Noto Sans KR, cursive', fontSize: '1.25rem' }}>
              STUDYBUDDY
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto nav-links-container">
              {currentUser && (
                <>
                  <Nav.Link as={Link} to="/dashboard" className="nav-link-item">대시보드</Nav.Link>
                  <Nav.Link as={Link} to="/groups" className="nav-link-item">그룹</Nav.Link>
                  <Nav.Link as={Link} to="/chat" className="nav-link-item">채팅</Nav.Link>
                  <Nav.Link as={Link} to="/schedule" className="nav-link-item">일정</Nav.Link>
                </>
              )}
            </Nav>
            <Nav>
              <div className="navbar-right-items">
                <div className="nav-button-group">
                  <div className="toggle-switch-wrapper">
                    <Form.Check 
                      type="switch"
                      id="dark-mode-switch"
                      checked={darkMode}
                      onChange={toggleDarkMode}
                      className="dark-mode-toggle"
                      label={darkMode ? "🌙" : "☀️"}
                    />
                  </div>
                  {currentUser ? (
                    <>
                      <Nav.Link as={Link} to="/profile" className="profile-link">
                        프로필
                      </Nav.Link>
                      <Button 
                        variant={transparent && !darkMode && isHomePage ? "outline-dark" : "outline-light"} 
                        onClick={handleLogout}
                        className="logout-button"
                        disabled={authLoading.logout}
                      >
                        {authLoading.logout ? '로그아웃 중...' : '로그아웃'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant={transparent && !darkMode && isHomePage ? "outline-dark" : "outline-light"} 
                        onClick={handleLoginModalOpen}
                        className="login-button"
                      >
                        로그인
                      </Button>
                      <Button 
                        variant={transparent && !darkMode && isHomePage ? "dark" : "light"}
                        className="text-white signup-button"
                        onClick={handleSignupModalOpen}
                      >
                        회원가입
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* 로그인 모달 */}
      <Modal 
        show={showLoginModal} 
        onHide={handleLoginModalClose}
        centered
        className={`auth-modal ${darkMode ? 'dark-mode' : ''}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>로그인</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group controlId="loginEmail">
              <Form.Label>이메일</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="이메일을 입력하세요"
              />
            </Form.Group>
            <Form.Group controlId="loginPassword" className="mt-3">
              <Form.Label>비밀번호</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="비밀번호를 입력하세요"
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-4" 
              disabled={authLoading.login}
            >
              {authLoading.login ? '로그인 중...' : '로그인'}
            </Button>
            <div className="text-center mt-3">
              <Button 
                variant="link" 
                onClick={handleSwitchToForgotPassword}
                className="p-0 text-decoration-none"
              >
                비밀번호를 잊어버리셨나요?
              </Button>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <p className="mb-0">
            계정이 없으신가요? 
            <Button 
              variant="link" 
              onClick={handleSwitchToSignup} 
              className="p-0 ms-1 text-decoration-none"
            >
              회원가입
            </Button>
          </p>
        </Modal.Footer>
      </Modal>
      
      {/* 회원가입 모달 */}
      <Modal 
        show={showSignupModal} 
        onHide={handleSignupModalClose}
        centered
        className={`auth-modal ${darkMode ? 'dark-mode' : ''}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>회원가입</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSignup}>
            <Form.Group controlId="signupName">
              <Form.Label>이름</Form.Label>
              <Form.Control 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                required 
                placeholder="이름을 입력하세요"
              />
            </Form.Group>
            <Form.Group controlId="signupEmail" className="mt-3">
              <Form.Label>이메일</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="이메일을 입력하세요"
              />
            </Form.Group>
            <Form.Group controlId="signupPassword" className="mt-3">
              <Form.Label>비밀번호</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="비밀번호를 입력하세요"
              />
            </Form.Group>
            <Form.Group controlId="signupPasswordConfirm" className="mt-3">
              <Form.Label>비밀번호 확인</Form.Label>
              <Form.Control 
                type="password" 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)} 
                required 
                placeholder="비밀번호를 다시 입력하세요"
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-4" 
              disabled={authLoading.signup || success}
            >
              {authLoading.signup ? '처리 중...' : '회원가입'}
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <p className="mb-0">
            이미 계정이 있으신가요? 
            <Button 
              variant="link" 
              onClick={handleSwitchToLogin} 
              className="p-0 ms-1 text-decoration-none"
            >
              로그인
            </Button>
          </p>
        </Modal.Footer>
      </Modal>
      
      {/* 인증번호 입력 모달 */}
      <Modal 
        show={showVerificationModal} 
        onHide={handleCloseVerificationModal}
        centered
        className={`auth-modal ${darkMode ? 'dark-mode' : ''}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>이메일 인증</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {codeError && (
            <Alert variant={codeError.includes('재발송') ? 'success' : 'danger'}>
              {codeError}
            </Alert>
          )}
          
          <p>
            <strong>{tempUserData?.email}</strong>로 인증번호가 발송되었습니다.
            이메일에서 인증번호를 확인하고 입력해주세요.
          </p>
          
          <Form onSubmit={handleVerifyCode}>
            <Form.Group controlId="verificationCode" className="mb-3">
              <Form.Label>인증번호</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value)} 
                  placeholder="인증번호 6자리 입력" 
                  maxLength={6}
                  required 
                />
                <span className="ms-2 text-danger">
                  {verificationTimer > 0 ? formatTimer(verificationTimer) : '만료됨'}
                </span>
              </div>
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={isVerifying || verificationTimer === 0}
              >
                {isVerifying ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    처리 중...
                  </>
                ) : '확인'}
              </Button>
              
              <Button 
                variant="outline-secondary" 
                onClick={handleResendCode}
                disabled={isVerifying}
              >
                인증번호 재발송
              </Button>
            </div>
          </Form>
          
          <div className="text-center mt-3">
            <p className="text-muted small">
              인증번호는 10분간 유효합니다.
              {verificationTimer === 0 && ' 만료된 경우 재발송 버튼을 클릭하세요.'}
            </p>
          </div>
        </Modal.Body>
      </Modal>
      
      {/* 비밀번호 재설정 모달 */}
      <Modal 
        show={showForgotPasswordModal} 
        onHide={handleForgotPasswordModalClose}
        centered
        className={`auth-modal ${darkMode ? 'dark-mode' : ''}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>비밀번호 재설정</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Form onSubmit={handleResetPassword}>
            <Form.Group controlId="forgotPasswordEmail">
              <Form.Label>이메일</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="이메일을 입력하세요"
              />
            </Form.Group>
            <p className="text-muted mt-3">
              가입하신 이메일 주소를 입력하시면 비밀번호 재설정 안내가 발송됩니다.
            </p>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3" 
              disabled={authLoading.resetPassword}
            >
              {authLoading.resetPassword ? '전송 중...' : '재설정 링크 발송'}
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <p className="mb-0">
            <Button 
              variant="link" 
              onClick={handleSwitchToLogin} 
              className="p-0 text-decoration-none"
            >
              로그인으로 돌아가기
            </Button>
          </p>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default AppNavbar;