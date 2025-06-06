import { useState, forwardRef, useImperativeHandle } from "react";
import { Navbar, Nav, Container, Button, Form, Modal, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "./LoadingSpinner"; 
import logoSmall from "../assets/logoSmall.png";
import logoLogin from "../assets/logoLogin.png";
import EmailVerificationService from "../utils/EmailVerificationService";
import useNotification from "../hooks/useNotification";
import useModal from "../hooks/useModal";

const AppNavbar = forwardRef((props, ref) => {
  // 컨텍스트 및 훅
  const { 
    currentUser, 
    logout, 
    login, 
    signup, 
    resetPassword, 
    authLoading 
  } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // 통합 알림 관리 (error, success, info)
  const { 
    error, 
    success, 
    info,
    showError, 
    showSuccess, 
    showInfo,
    clearAll 
  } = useNotification();
  
  // 통합 모달 관리 (login, signup, forgot)
  const {
    openModal,
    closeModal,
    switchModal,
    isOpen
  } = useModal(["login", "signup", "forgot"]);
  
  // 폼 상태 관리
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ref를 통해 외부에서 접근 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    handleLoginModalOpen,
    handleSignupModalOpen,
    handleForgotPasswordModalOpen
  }));
  
  // 모달 핸들러 함수들
  const handleLoginModalOpen = () => {
    clearAll();
    setEmail("");
    setPassword("");
    openModal("login");
  };
  
  const handleSignupModalOpen = () => {
    clearAll();
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setDisplayName("");
    openModal("signup");
  };
  
  const handleForgotPasswordModalOpen = () => {
    clearAll();
    setEmail("");
    openModal("forgot");
  };
  
  const handleLoginModalClose = () => {
    clearAll();
    closeModal("login");
  };
  
  const handleSignupModalClose = () => {
    clearAll();
    closeModal("signup");
  };
  
  const handleForgotPasswordModalClose = () => {
    clearAll();
    closeModal("forgot");
  };
  
  // 모달 전환 함수들
  const handleSwitchToSignup = () => {
    clearAll();
    switchModal("login", "signup");
  };
  
  const handleSwitchToLogin = () => {
    clearAll();
    switchModal("signup", "login");
  };
  
  const handleSwitchToForgotPassword = () => {
    clearAll();
    switchModal("login", "forgot");
  };
  
  const handleSwitchToLoginFromForgot = () => {
    clearAll();
    switchModal("forgot", "login");
  };
  
  // 인증 관련 핸들러 함수들
  
  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      clearAll();
      await login(email, password);
      closeModal("login");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      showError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    }
  };
  
  // 회원가입 처리
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // 입력 유효성 검증
    if (password !== passwordConfirm) {
      return showError("비밀번호가 일치하지 않습니다.");
    }
    
    if (password.length < 6) {
      return showError("비밀번호는 최소 6자 이상이어야 합니다.");
    }
    
    if (!email.endsWith("@chungbuk.ac.kr")) {
      return showError("충북대학교 이메일(@chungbuk.ac.kr)만 가입할 수 있습니다.");
    }
    
    try {
      clearAll();
      setIsProcessing(true);
      
      // 1. 이메일 유효성 확인
      let verificationResponse;
      try {
        verificationResponse = await EmailVerificationService.verifyEmail(email);
        
        if (!verificationResponse.success) {
          throw new Error(verificationResponse.message || "유효하지 않은 이메일입니다.");
        }
      } catch (verificationError) {
        console.error("이메일 확인 요청 오류:", verificationError);
        showError("이메일 확인 요청에 실패했습니다: " + verificationError.message);
        return;
      }
      
      // 2. 계정 생성
      try {
        await signup(
          email,
          password,
          displayName,
          true,
          verificationResponse.certified_date || new Date().toISOString()
        );
        
        showSuccess("회원가입이 완료되었습니다.");
        
        setTimeout(() => {
          closeModal("signup");
          navigate("/dashboard");
        }, 1500);
      } catch (signupError) {
        console.error("계정 생성 중 오류:", signupError);
        
        // currentUser가 이미 설정되어 있으면 성공으로 처리
        if (currentUser) {
          showSuccess("회원가입이 완료되었습니다.");
          setTimeout(() => {
            closeModal("signup");
            navigate("/dashboard");
          }, 1500);
        } else {
          showError("계정 생성 중 오류가 발생했습니다: " + (signupError.message || "알 수 없는 오류"));
        }
      }
    } catch (error) {
      console.error("회원가입 프로세스 오류:", error);
      showError("회원가입 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 비밀번호 재설정 처리
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    try {
      clearAll();
      await resetPassword(email);
      showInfo("이메일로 비밀번호 재설정 안내가 발송되었습니다.");
      setTimeout(() => {
        switchModal("forgot", "login");
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);
      showError("비밀번호 재설정에 실패했습니다. 이메일 주소를 확인해주세요.");
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 통일된 네비게이션 바 클래스 (다크모드에 따라서만 변경)
  const navbarClass = `dashboard-navbar ${darkMode ? "dark-mode" : ""}`;

  return (
    <>
      {/* 로딩 오버레이 */}
      {(authLoading.login || isProcessing || authLoading.resetPassword) && <LoadingSpinner />}
      
      {/* 메인 네비게이션 바 - 모든 페이지에서 동일 */}
      <Navbar 
        variant={darkMode ? "dark" : "light"} 
        expand="lg" 
        className={navbarClass} 
        fixed="top"
      >
        <Container>
          {/* 브랜드 로고 및 제목 */}
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center navbar-brand-container">
            <img
              src={logoSmall}
              alt="StudyBuddy Logo"
              height="30"
              className="d-inline-block align-top me-2"
            />
            <span className="fw-bold" style={{ fontSize: "1.25rem" }}>
              STUDYBUDDY
            </span>
          </Navbar.Brand>
          
          {/* 모바일 토글 버튼 */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            {/* 왼쪽 네비게이션 링크들 */}
            <Nav className="me-auto nav-links-container">
              {currentUser && (
                <>
                  <Nav.Link as={Link} to="/dashboard" className="nav-link-item">대시보드</Nav.Link>
                  <Nav.Link as={Link} to="/groups" className="nav-link-item">그룹</Nav.Link>
                  <Nav.Link as={Link} to="/schedule" className="nav-link-item">일정</Nav.Link>
                </>
              )}
            </Nav>
            
            {/* 오른쪽 네비게이션 요소들 */}
            <Nav>
              <div className="navbar-right-items">
                <div className="nav-button-group">
                  {/* 다크모드 토글 스위치 */}
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
                  
                  {/* 로그인 상태에 따른 버튼 표시 */}
                  {currentUser ? (
                    <>
                      <Nav.Link as={Link} to="/profile" className="profile-link">
                        프로필
                      </Nav.Link>
                      <Button 
                        variant={darkMode ? "outline-light" : "outline-dark"} 
                        onClick={handleLogout}
                        className="logout-button"
                        disabled={authLoading.logout}
                      >
                        {authLoading.logout ? "로그아웃 중..." : "로그아웃"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant={darkMode ? "outline-light" : "outline-dark"} 
                        onClick={handleLoginModalOpen}
                        className="login-button"
                      >
                        로그인
                      </Button>
                      <Button 
                        variant="primary"
                        onClick={handleSignupModalOpen}
                        className="signup-button"
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
        show={isOpen("login")} 
        onHide={handleLoginModalClose}
        centered
        className={`auth-modal ${darkMode ? "dark-mode" : ""}`}
      >
        {/* 로고 섹션 */}
        <div className="modal-logo-section">
          <img src={logoLogin} alt="StudyBuddy Login" className="modal-logo" />
          <Button 
            type="button"
            className="btn-close-custom" 
            aria-label="Close"
            onClick={handleLoginModalClose}
          >
            <i className="bi bi-x-circle fs-2"></i>
          </Button>
        </div>
        
        <Modal.Body>
          {/* 알림 메시지 표시 */}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {info && <Alert variant="info">{info}</Alert>}
          
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
              {authLoading.login ? "로그인 중..." : "로그인"}
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
        show={isOpen("signup")} 
        onHide={handleSignupModalClose}
        centered
        className={`auth-modal ${darkMode ? "dark-mode" : ""}`}
      >
        {/* 로고 섹션 */}
        <div className="modal-logo-section">
          <img src={logoLogin} alt="StudyBuddy Signup" className="modal-logo" />
          <Button 
            type="button"
            className="btn-close-custom" 
            aria-label="Close"
            onClick={handleSignupModalClose}
          >
            <i className="bi bi-x-circle fs-2"></i>
          </Button>
        </div>
        
        <Modal.Body>
          {/* 알림 메시지 표시 */}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {info && <Alert variant="info">{info}</Alert>}
          
          <Form onSubmit={handleSignup}>
            <Form.Group controlId="signupName">
              <Form.Label>이름</Form.Label>
              <Form.Control 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                required 
                placeholder="이름을 입력하세요"
                disabled={isProcessing}
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
                disabled={isProcessing}
              />
              <Form.Text className="text-muted">
                충북대학교 이메일(@chungbuk.ac.kr)만 가입 가능합니다.
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="signupPassword" className="mt-3">
              <Form.Label>비밀번호</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="비밀번호를 입력하세요"
                disabled={isProcessing}
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
                disabled={isProcessing}
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-4" 
              disabled={isProcessing || success}
            >
              {isProcessing ? (
                <>
                  <Spinner 
                    as="span" 
                    animation="border" 
                    size="sm" 
                    role="status" 
                    aria-hidden="true" 
                    className="me-2"
                  />
                  처리 중...
                </>
              ) : (
                success ? "회원가입 완료" : "회원가입"
              )}
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
              disabled={isProcessing}
            >
              로그인
            </Button>
          </p>
        </Modal.Footer>
      </Modal>
      
      {/* 비밀번호 재설정 모달 */}
      <Modal 
        show={isOpen("forgot")} 
        onHide={handleForgotPasswordModalClose}
        centered
        className={`auth-modal ${darkMode ? "dark-mode" : ""}`}
      >
        {/* 로고 섹션 */}
        <div className="modal-logo-section">
          <img src={logoLogin} alt="StudyBuddy Password Reset" className="modal-logo" />
          <Button 
            type="button"
            className="btn-close-custom" 
            aria-label="Close"
            onClick={handleForgotPasswordModalClose}
          >
            <i className="bi bi-x-circle fs-2"></i>
          </Button>
        </div>
        
        <Modal.Body>
          {/* 알림 메시지 표시 */}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {info && <Alert variant="info">{info}</Alert>}
          
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
              {authLoading.resetPassword ? "전송 중..." : "재설정 링크 발송"}
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <p className="mb-0">
            <Button 
              variant="link" 
              onClick={handleSwitchToLoginFromForgot} 
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