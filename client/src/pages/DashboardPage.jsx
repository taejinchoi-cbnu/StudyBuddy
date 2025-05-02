import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import '../styles/DashboardStyles.css';
import logoSmall from '../assets/logoSmall.png'; // 로고 이미지 import

const DashboardPage = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // 다크모드 디테일하게 로직 추가해야함
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      setError('로그아웃에 실패했습니다.');
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className={`dashboard-layout ${darkMode ? 'dark-mode' : ''}`}>
      {/* AppNavbar 스타일 적용 */}
      <Navbar variant="dark" expand="lg" className="dashboard-navbar" fixed="top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <img
              src={logoSmall}
              alt="StudyBuddy Logo"
              height="30"
              className="d-inline-block align-top me-2"
            />
            <span className="fw-bold" style={{ fontFamily: 'Poor Story, cursive', fontSize: '1.25rem' }}>
              STUDYBUDDY
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dashboard">대시보드</Nav.Link>
              <Nav.Link as={Link} to="/groups">그룹</Nav.Link>
              <Nav.Link as={Link} to="/chat">채팅</Nav.Link>
              <Nav.Link as={Link} to="/schedule">일정</Nav.Link>
            </Nav>
            <Nav className="navbar-right-items">
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
                <Nav.Link as={Link} to="/profile" className="profile-link">
                  프로필
                </Nav.Link>
                <Button variant="outline-light" onClick={handleLogout} className="logout-button">
                  로그아웃
                </Button>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="main-area-full">
        <div className="navbar-spacer"></div>
        
        {/* 대시보드 내용 */}
        <main className="dashboard-content">
          {error && <div className="main-error">{error}</div>}
          
          {/* 스터디 시간 차트 */}
          <div className="study-chart-container">
            <div className="chart-card">
              <h3 className="card-title">스터디 시간을 보여주는 chart</h3>
              <div className="chart-content">
                {/* 차트가 들어갈 영역 */}
              </div>
            </div>
          </div>
          
          <div className="dashboard-grid">
            {/* 스터디 그룹 카드 */}
            <div className="dashboard-card">
              <h3 className="card-title">간단한 할 일 input</h3>
              <div className="card-content">
                <p>체크 클릭 시 middle-line이 생기고 X누를 시 사라짐</p>
              </div>
            </div>
            
            {/* 일정 카드 */}
            <div className="dashboard-card">
              <h3 className="card-title">내 스터디 그룹</h3>
              <div className="card-content">
                <p>기존과 동일 size만 변경</p>
              </div>
            </div>
            
            {/* 알림 카드 */}
            <div className="dashboard-card">
              <h3 className="card-title">최근 알림</h3>
              <div className="card-content">
                <p>기존과 동일 size만 변경</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;