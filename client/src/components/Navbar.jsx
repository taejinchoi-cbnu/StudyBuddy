import { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoSmall from '../assets/logoSmall.png'; // 로고 이미지 import

const AppNavbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTransparent, setIsTransparent] = useState(location.pathname === '/');
  
  // 스크롤에 따라 네비게이션 바 스타일 변경
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    // 현재 경로가 홈페이지인 경우에만 투명 네비게이션 바 적용
    setIsTransparent(location.pathname === '/');
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);
  
  // 항상 투명 유지, 스크롤해도 배경색 추가하지 않음
  const navbarStyle = isTransparent ? 'transparent-navbar' : '';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Navbar 
      variant={isTransparent ? "light" : "dark"} 
      expand="lg" 
      className={navbarStyle} 
      fixed="top"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src={logoSmall}
            alt="StudyBuddy Logo"
            height="30"
            className="d-inline-block align-top me-2"
          />
          <span className="fw-bold" style={{ fontFamily: 'Single Day, cursive', fontSize: '1.25rem' }}>
            STUDYBUDDY
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {currentUser && (
              <>
                <Nav.Link as={Link} to="/dashboard">대시보드</Nav.Link>
                {/* These links will be implemented in future weeks */}
                <Nav.Link as={Link} to="/groups">그룹</Nav.Link>
                <Nav.Link as={Link} to="/schedule">일정</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {currentUser ? (
              <>
                <Nav.Link as={Link} to="/profile">프로필</Nav.Link>
                <Button 
                  variant={isTransparent ? "outline-dark" : "outline-light"} 
                  onClick={handleLogout}
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                {!isTransparent && (
                  <>
                    <Nav.Link as={Link} to="/login">로그인</Nav.Link>
                    <Nav.Link as={Link} to="/signup">회원가입</Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;