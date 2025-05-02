import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/DashboardStyles.css';

const DashboardPage = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // 실제로는 여기에 다크모드 전환 로직을 추가할 수 있습니다
  };

  const handleLogout = async () => {
    try {
      await logout();
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
      {/* 좌측 네비게이션 바 */}
      <nav className="side-navbar">
        <div className="logo-container">
          <img src="/src/assets/logoTextGif.gif" alt="StudyBuddy" className="sidebar-logo" />
        </div>
        
        <div className="nav-links">
          <Link to="/dashboard" className="nav-item active">
            <span className="nav-icon">🏠</span>
            <span className="nav-text">홈</span>
          </Link>
          <Link to="/groups" className="nav-item">
            <span className="nav-icon">👥</span>
            <span className="nav-text">스터디 그룹</span>
          </Link>
          <Link to="/chat" className="nav-item">
            <span className="nav-icon">💬</span>
            <span className="nav-text">채팅</span>
          </Link>
          <Link to="/schedule" className="nav-item">
            <span className="nav-icon">📅</span>
            <span className="nav-text">나의 스케줄</span>
          </Link>
          <Link to="/profile" className="nav-item">
            <span className="nav-icon">👤</span>
            <span className="nav-text">내 정보</span>
          </Link>
        </div>
        
        <div className="sidebar-footer">
          <div className="mode-toggle" onClick={toggleDarkMode}>
            <span>{darkMode ? '☀️' : '🌙'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            <span className="nav-text">로그아웃</span>
          </button>
        </div>
      </nav>

      <div className="main-area">
        {/* 상단 헤더 */}
        <header className="top-header">
          <h1>대시보드</h1>
          <div className="user-profile-preview">
            <span className="welcome-text">안녕하세요, {userProfile.displayName || '사용자'}님!</span>
            <img 
              src={userProfile.profileImageUrl || '/src/assets/logoSmall.png'} 
              alt="프로필" 
              className="profile-thumbnail" 
            />
          </div>
        </header>

        {/* 대시보드 내용 */}
        <main className="dashboard-content">
          {error && <div className="main-error">{error}</div>}
          
          <div className="dashboard-grid">
            {/* 프로필 카드 */}
            <div className="dashboard-card">
              <h3 className="card-title">내 프로필</h3>
              <div className="card-content">
                <p><strong>이메일:</strong> {currentUser.email}</p>
                <p><strong>학과:</strong> {userProfile.department || '설정되지 않음'}</p>
                <p>
                  <strong>관심분야:</strong> {userProfile.interests && userProfile.interests.length > 0
                    ? userProfile.interests.join(', ')
                    : '추가된 관심분야가 없습니다'
                  }
                </p>
                <Link to="/profile" className="card-button">
                  프로필 편집
                </Link>
              </div>
            </div>
            
            {/* 스터디 그룹 카드 */}
            <div className="dashboard-card">
              <h3 className="card-title">내 스터디 그룹</h3>
              <div className="card-content">
                <p>아직 참여 중인 스터디 그룹이 없습니다.</p>
                <Link to="/groups/find" className="card-button accent">
                  그룹 찾기
                </Link>
              </div>
            </div>
            
            {/* 일정 카드 */}
            <div className="dashboard-card">
              <h3 className="card-title">예정된 스터디 세션</h3>
              <div className="card-content">
                <p>예정된 스터디 세션이 없습니다.</p>
                <Link to="/schedule" className="card-button">
                  일정 보기
                </Link>
              </div>
            </div>
            
            {/* 알림 카드 */}
            <div className="dashboard-card">
              <h3 className="card-title">최근 알림</h3>
              <div className="card-content">
                <p>새로운 알림이 없습니다.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;