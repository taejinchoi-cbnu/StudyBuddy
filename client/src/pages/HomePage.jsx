import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import AppNavbar from '../components/AppNavbar';
import '../styles/MainStyles.css';

const HomePage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // AppNavbar에 대한 참조 생성
  const navbarRef = useRef();
  
  // 로그인/회원가입 버튼 핸들러
  const handleSignup = () => {
    if (navbarRef.current && typeof navbarRef.current.handleSignupModalOpen === 'function') {
      navbarRef.current.handleSignupModalOpen();
    }
  };
  
  const handleLogin = () => {
    if (navbarRef.current && typeof navbarRef.current.handleLoginModalOpen === 'function') {
      navbarRef.current.handleLoginModalOpen();
    }
  };

  return (
    <div className={`main-layout home-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 투명 네비게이션 바 사용 - ref 전달 */}
      <div className="transparent-navbar-wrapper">
        <AppNavbar 
          transparent={true} 
          ref={navbarRef}
        />
      </div>
      
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
                <button onClick={handleSignup} className="hero-button accent">
                  시작하기
                </button>
                <button onClick={handleLogin} className="hero-button">
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
          <div className="dashboard-card feature-card">
            <div className="feature-icon">
              <span>👥</span>
            </div>
            <h3 className="card-title">스터디 파트너 찾기</h3>
            <div className="card-content">
              <p className="feature-text">학업적 관심사와 목표를 공유하는 학생들과 연결하세요</p>
            </div>
          </div>
          
          <div className="dashboard-card feature-card">
            <div className="feature-icon">
              <span>📅</span>
            </div>
            <h3 className="card-title">일정 조율</h3>
            <div className="card-content">
              <p className="feature-text">공통된 가능 시간을 쉽게 찾고 스터디 세션을 예약하세요</p>
            </div>
          </div>
          
          <div className="dashboard-card feature-card">
            <div className="feature-icon">
              <span>💬</span>
            </div>
            <h3 className="card-title">실시간 협업</h3>
            <div className="card-content">
              <p className="feature-text">스터디 그룹과 실시간으로 채팅하고 자료를 공유하세요</p>
            </div>
          </div>
        </section>

        {/* CTA 섹션 - 로그인 상태가 아닐 때만 표시 */}
        {!currentUser && (
          <section className="cta-section">
            <h2 className="cta-title">학업 성공을 높일 준비가 되셨나요?</h2>
            <p className="cta-text">오늘 스터디버디에 가입하고 협업을 시작하세요!</p>
            <button onClick={handleSignup} className="cta-button">
              지금 가입하기
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default HomePage;