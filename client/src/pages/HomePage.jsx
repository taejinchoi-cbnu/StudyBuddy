import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import AppNavbar from '../components/AppNavbar';
import logoHome from '../assets/logoHome.png';
import calendar from '../assets/calendar.png';
import peoples from '../assets/peoples.png';

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

  // 특징 아이템 컴포넌트 (이미지 왼쪽, 텍스트 오른쪽)
  const FeatureItem = ({ imgSrc, imgAlt, title, description }) => (
    <div className="feature-item">
      <div className="feature-image-container">
        <img src={imgSrc} alt={imgAlt} className="feature-image" />
      </div>
      <div className="feature-text-container">
        <h3 className="feature-title">{title}</h3>
        <p className="feature-description">{description}</p>
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
            <h1 className="hero-title">STUDY BUDDY</h1>
            <p className="hero-text">
              같은 꿈을 꾸는 우리가 만나는 곳, StudyBuddy에서
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
          <FeatureItem 
            imgSrc={peoples}
            imgAlt="팀원 찾기" 
            title="스터디 파트너 찾기" 
            description={
              <>
              같은 목표를 가진 학생들과 팀을 이루고 함께 성장해보세요. <br />
              관심사와 목표가 맞는 팀원을 쉽게 찾을 수 있도록 돕고 꾸준히 함께 공부할 수 있는 환경을 제공합니다.
              </>
            }
          />
          
          <FeatureItem 
            imgSrc={calendar} 
            imgAlt="일정 조율" 
            title="일정 조율" 
            description={
              <>
              스케줄 맞추기, 이젠 고민 말고 맡기세요. <br />
              스케줄 자동 분석으로 모두에게 딱 맞는 미팅 시간을 스마트하게 추천해 드려요.
              </>
            }
          />
        </section>

        {/* CTA 섹션 - 로그인 상태가 아닐 때만 표시 */}
        {!currentUser && (
          <section className="cta-section">
            <h2 className="cta-title">함께 배우고 성장하세요</h2>
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