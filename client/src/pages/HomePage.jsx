import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import AppNavbar from '../components/AppNavbar';
import logoHome from '../assets/logoHome.png';

const HomePage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // AppNavbar에 대한 참조 생성
  const navbarRef = useRef();
  
  // useCallback으로 메모이제이션하여 (성능 최적화)
  const handleSignup = useCallback(() => {
    if (navbarRef.current?.handleSignupModalOpen) {
      navbarRef.current.handleSignupModalOpen();
    }
  }, [navbarRef]);
  
  const handleLogin = useCallback(() => {
    if (navbarRef.current?.handleLoginModalOpen) {
      navbarRef.current.handleLoginModalOpen();
    }
  }, [navbarRef]);

  // 대시보드 이동 핸들러 최적화
  const navigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  // 특징 카드를 위한 재사용 가능한 컴포넌트
  const FeatureCard = ({ icon, title, description }) => (
    <div className="dashboard-card feature-card">
      <div className="feature-icon" aria-label={`${title} 아이콘`}>
        <span>{icon}</span>
      </div>
      <h3 className="card-title">{title}</h3>
      <div className="card-content">
        <p className="feature-text">{description}</p>
      </div>
    </div>
  );

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
            <h1 className="hero-title">제목</h1>
            <p className="hero-text">
              프로젝트를 설명하는 짧은 글
            </p>
            {currentUser ? (
              <button 
                type="button" 
                onClick={navigateToDashboard} 
                className="hero-button accent"
              >
                대시보드로 이동
              </button>
            ) : (
              <div className="hero-buttons">
                <button 
                  type="button" 
                  onClick={handleSignup} 
                  className="hero-button accent"
                >
                  시작하기
                </button>
                <button 
                  type="button" 
                  onClick={handleLogin} 
                  className="hero-button"
                >
                  로그인
                </button>
              </div>
            )}
          </div>
          <div className="hero-image-container">
            <img 
              src={logoHome} 
              alt="스터디버디 일러스트레이션" 
              className="hero-image"
              loading="eager"
            />
          </div>
        </section>

        {/* 특징 섹션 */}
        <section className="features-section">
          <FeatureCard 
            icon="👥" 
            title="스터디 파트너 찾기" 
            description="목표를 공유하는 학생들과 팀을 만들어보아요"
          />
          
          <FeatureCard 
            icon="📅" 
            title="일정 조율" 
            description="알고리즘을 통해 빠르게 미팅 시간을 정해보세요"
          />
          
        </section>

        {/* CTA 섹션 - 로그인 상태가 아닐 때만 표시 */}
        {!currentUser && (
          <section className="cta-section">
            <h2 className="cta-title">CTA 섹션 타이틀</h2>
            <p className="cta-text">오늘 스터디버디에 가입하고 협업을 시작하세요!</p>
            <button 
              type="button" 
              onClick={handleSignup} 
              className="cta-button"
            >
              지금 가입하기
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default HomePage;