import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import '../styles/MainStyles.css';

const HomePage = () => {
  const { currentUser, login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  // 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  
  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
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
  
  // 로그인 핸들러
  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      handleLoginModalClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };
  
  // 회원가입 핸들러
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (password !== passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }
    
    if (password.length < 6) {
      return setError('비밀번호는 최소 6자 이상이어야 합니다.');
    }
    
    try {
      setError('');
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };
  
  // 비밀번호 재설정 핸들러
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('이메일로 비밀번호 재설정 안내가 발송되었습니다.');
      setTimeout(() => {
        handleForgotPasswordModalClose();
        handleLoginModalOpen();
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setError('비밀번호 재설정에 실패했습니다. 이메일 주소를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-layout home-page">
      {/* 메인 콘텐츠 */}
      <main className="main-content">
        {/* 히어로 섹션 */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">함께 공부하고, 더 나은 결과를</h1>
            <p className="hero-text">
              스터디버디는 다른 학생들과 연결하여 스터디 그룹을 형성하고, 공통된 스케줄을 찾아 더 나은 학습 결과를 얻을 수 있도록 도와줍니다!
            </p>
            {currentUser ? (
              <button onClick={() => navigate('/dashboard')} className="hero-button accent">
                대시보드로 이동
              </button>
            ) : (
              <div className="hero-buttons">
                <button onClick={handleSignupModalOpen} className="hero-button accent">
                  시작하기
                </button>
                <button onClick={handleLoginModalOpen} className="hero-button">
                  로그인
                </button>
              </div>
            )}
          </div>
          <div className="hero-image-container">
            <img 
              src="/src/assets/logoHome.png" 
              alt="스터디버디 일러스트레이션" 
              className="hero-image"
            />
          </div>
        </section>

        {/* 특징 섹션 */}
        <section className="features-section">
          <div className="feature-card">
            <div className="feature-icon">
              <span>👥</span>
            </div>
            <h3 className="feature-title">스터디 파트너 찾기</h3>
            <p className="feature-text">학업적 관심사와 목표를 공유하는 학생들과 연결하세요</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>📅</span>
            </div>
            <h3 className="feature-title">일정 조율</h3>
            <p className="feature-text">공통된 가능 시간을 쉽게 찾고 스터디 세션을 예약하세요</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>💬</span>
            </div>
            <h3 className="feature-title">실시간 협업</h3>
            <p className="feature-text">스터디 그룹과 실시간으로 채팅하고 자료를 공유하세요</p>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="cta-section">
          <h2 className="cta-title">학업 성공을 높일 준비가 되셨나요?</h2>
          <p className="cta-text">오늘 스터디버디에 가입하고 협업을 시작하세요!</p>
          {!currentUser && (
            <button onClick={handleSignupModalOpen} className="cta-button">
              지금 가입하기
            </button>
          )}
        </section>
      </main>
      
      {/* 로그인 모달 */}
      <Modal 
        show={showLoginModal} 
        onHide={handleLoginModalClose}
        centered
        className="auth-modal"
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
              disabled={loading}
            >
              로그인
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
        className="auth-modal"
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
              disabled={loading}
            >
              회원가입
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
        className="auth-modal"
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
              disabled={loading}
            >
              재설정 링크 발송
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
    </div>
  );
};

export default HomePage;