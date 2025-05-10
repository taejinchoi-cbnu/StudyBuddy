import { useState, forwardRef, useImperativeHandle } from 'react';
import { Navbar, Nav, Container, Button, Form, Modal, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import LoadingSpinner from './LoadingSpinner'; 
import logoSmall from '../assets/logoSmall.png';

const AppNavbar = forwardRef(({ transparent = false }, ref) => {
  // 컨텍스트 훅 사용
  const { currentUser, logout, login, signup, resetPassword, authLoading } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 모달 상태 관리
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  
  // 폼 상태 관리
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // ref를 통해 외부에서 접근 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    handleLoginModalOpen,
    handleSignupModalOpen,
    handleForgotPasswordModalOpen
  }));
  
  // 모달 핸들러
  const handleLoginModalOpen = () => {
    setError('');
    setEmail('');
    setPassword('');
    setShowLoginModal(true);
  };
  
  const handleSignupModalOpen = () => {
    setError('');
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
    setShowLoginModal(false);
  };
  
  const handleSignupModalClose = () => {
    setShowSignupModal(false);
  };
  
  const handleForgotPasswordModalClose = () => {
    setShowForgotPasswordModal(false);
  };
  
  const handleSwitchToSignup = () => {
    handleLoginModalClose();
    handleSignupModalOpen();
  };
  
  const handleSwitchToLogin = () => {
    handleSignupModalClose();
    handleLoginModalOpen();
  };
  
  const handleSwitchToForgotPassword = () => {
    handleLoginModalClose();
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
    
    // 잘못된 입력들
    if (password !== passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }
    
    if (password.length < 6) {
      return setError('비밀번호는 최소 6자 이상이어야 합니다.');
    }
    
    try {
      setError('');
      await signup(email, password, displayName);
      handleSignupModalClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('계정 생성에 실패했습니다.');
      }
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
              disabled={authLoading.signup}
            >
              {authLoading.signup ? '회원가입 중...' : '회원가입'}
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