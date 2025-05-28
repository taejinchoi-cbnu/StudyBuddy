import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import AppNavbar from "../components/AppNavbar";
import logoHome from "../assets/logoHome.png";
import logoSmall from "../assets/logoSmall.png";
import logoHello from "../assets/logoHello.png"
import calendar from "../assets/calendar.png";
import peoples from "../assets/peoples.png";

const HomePage = () => {
  // ======================================================
  // 컨텍스트 및 훅 사용
  // ======================================================
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // AppNavbar에 대한 참조 생성 (모달 제어용)
  const navbarRef = useRef();
  
  // ======================================================
  // 이벤트 핸들러 함수들 (성능 최적화를 위해 useCallback 사용)
  // ======================================================
  
  // 회원가입 모달 열기
  const handleSignup = useCallback(() => {
    if (navbarRef.current?.handleSignupModalOpen) {
      navbarRef.current.handleSignupModalOpen();
    }
  }, []);
  
  // 로그인 모달 열기
  const handleLogin = useCallback(() => {
    if (navbarRef.current?.handleLoginModalOpen) {
      navbarRef.current.handleLoginModalOpen();
    }
  }, []);

  // 대시보드로 이동
  const navigateToDashboard = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  // ======================================================
  // 특징 아이템 컴포넌트 (재사용 가능한 컴포넌트)
  // ======================================================
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
    <div className={`main-layout home-page ${darkMode ? "dark-mode" : ""}`}>
    {/* 네비게이션 바 - 절대 위치로 히어로 섹션 위에 오버레이 */}
    <div className="transparent-navbar-wrapper" style={{ position: 'absolute', zIndex: 1050 }}>
      <AppNavbar 
        transparent={true} 
        ref={navbarRef}
      />
    </div>
      
      {/* ======================================================
          메인 콘텐츠 영역
          ====================================================== */}
      <main className="main-content">
        
        {/* 히어로 섹션 - 메인 랜딩 영역 */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text-section">
              <h1 className="hero-title">
                Welcome<br />
                <span className="hero-title-highlight">to</span><br />
                Study Buddy
              </h1>
              <p className="hero-description">
                같은 꿈을 꾸는 우리가 만나는 곳, StudyBuddy에서<br />
                함께 성장하고 목표를 달성해보세요.
              </p>
              
              {/* 로그인 상태에 따른 버튼 표시 */}
              <div className="hero-buttons">
                {currentUser ? (
                  <button 
                    type="button" 
                    onClick={navigateToDashboard} 
                    className="hero-button-primary"
                  >
                    대시보드로 이동
                  </button>
                ) : (
                  <>
                    <button 
                      type="button" 
                      onClick={handleSignup} 
                      className="hero-button-primary"
                    >
                      시작하기
                    </button>
                    <button 
                      type="button" 
                      onClick={handleLogin} 
                      className="hero-button-secondary"
                    >
                      로그인 »
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* 히어로 이미지 */}
          <div className="hero-image-container">
            <img 
              src={logoHome} 
              alt="StudyBuddy 메인 일러스트레이션" 
              className="hero-main-image"
              loading="eager"
            />
          </div>
        </section>

        {/* 서비스 소개 섹션 */}
        <section className="service-intro-section">
          <div className="service-intro-content">
            <div className="service-image-container">
              <img 
                src={logoSmall} 
                alt="StudyBuddy 서비스 로고" 
                className="service-intro-image"
              />
            </div>
            <div className="service-text-container">
              <p className="service-subtitle">How we help</p>
              <h2 className="service-title">
                적절한 팀원을 구하는게 어려웠는데,<br />
                스터디 버디로 해결했어요!
              </h2>
            </div>
            <div className="service-testimonials">
              <div className="testimonial-avatars">
                <div className="testimonial-avatar">
                  <img src={logoHello} alt="사용자 후기 1" className="avatar-image" />
                </div>
              </div>
              <div className="testimonial-content">
                <span className="testimonial-rating">평점: ★★★★★</span>
              </div>
            </div>
          </div>
        </section>

        {/* 주요 특징 섹션 */}
        <section className="features-section">
          <FeatureItem 
            imgSrc={peoples}
            imgAlt="스터디 파트너 찾기" 
            title="스터디 파트너 찾기" 
            description={
              <>
                같은 목표를 가진 학생들과 팀을 이루고 함께 성장해보세요.<br />
                관심사와 목표가 맞는 팀원을 쉽게 찾을 수 있도록 돕고<br />
                꾸준히 함께 공부할 수 있는 환경을 제공합니다.
              </>
            }
          />
          
          <FeatureItem 
            imgSrc={calendar} 
            imgAlt="스마트 일정 조율" 
            title="스마트 일정 조율" 
            description={
              <>
                스케줄 맞추기, 이젠 고민 말고 맡기세요.<br />
                스케줄 자동 분석으로 모두에게 딱 맞는 미팅 시간을<br />
                스마트하게 추천해 드려요.
              </>
            }
          />
        </section>

        {/* CTA(Call To Action) 섹션 - 비로그인 사용자에게만 표시 */}
        {!currentUser && (
          <section className="cta-section">
            <h2 className="cta-title">함께 배우고 성장하세요</h2>
            <p className="cta-text">
              오늘 StudyBuddy에 가입하고 스터디 그룹 활동을 시작해보세요!
            </p>
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