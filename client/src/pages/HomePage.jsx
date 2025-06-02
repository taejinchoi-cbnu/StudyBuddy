import { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import AppNavbar from "../components/AppNavbar";
import FeatureCard from "../components/common/FeatureCard";
import HeroButton from "../components/common/HeroButton";
import AnimatedSection from "../components/common/AnimatedSection";
import logoHome from "../assets/logoHome.png";
import logoSmall from "../assets/logoSmall.png";
import logoHello from "../assets/logoHello.png";
import calendar from "../assets/calendar.png";
import peoples from "../assets/peoples.png";

const HomePage = () => {
  // 컨텍스트 및 훅 사용
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // AppNavbar에 대한 참조 생성 (모달 제어용)
  const navbarRef = useRef();
  
  // 이벤트 핸들러 함수들 (성능 최적화를 위해 useCallback 사용)
  
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

  // 특징 섹션 데이터
  const features = [
    {
      imgSrc: peoples,
      imgAlt: "파트너 찾기",
      title: "파트너 찾기",
      description: "같은 목표를 가진 학생들과 팀을 이루고 함께 성장해보세요. 관심사와 목표가 맞는 팀원을 쉽게 찾을 수 있습니다.",
      benefits: [
        "관심사 기반 매칭",
        "목표 지향적 팀 구성",
        "지속적인 동기 부여"
      ]
    },
    {
      imgSrc: calendar,
      imgAlt: "스마트 일정 조율",
      title: "스마트 일정 조율",
      description: "스케줄 맞추기의 고민을 덜어드립니다. 스케줄 자동 분석으로 모두에게 최적화된 미팅 시간을 제안합니다.",
      benefits: [
        "자동 시간 분석",
        "최적 시간 추천",
        "실시간 스케줄 동기화"
      ]
    }
  ];

  return (
    <div className={`main-layout home-page ${darkMode ? "dark-mode" : ""}`}>
      {/* 네비게이션 바 */}
      <div className="transparent-navbar-wrapper" style={{ position: "absolute", zIndex: 1050 }}>
        <AppNavbar 
          transparent={true} 
          ref={navbarRef}
        />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
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
                  <HeroButton 
                    variant="primary"
                    onClick={navigateToDashboard}
                  >
                    대시보드로 이동
                  </HeroButton>
                ) : (
                  <>
                    <HeroButton 
                      variant="primary"
                      onClick={handleSignup}
                    >
                      시작하기
                    </HeroButton>
                    <HeroButton 
                      variant="secondary"
                      onClick={handleLogin}
                    >
                      로그인 »
                    </HeroButton>
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
        <AnimatedSection className="service-intro-section">
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
        </AnimatedSection>

        {/* 주요 특징 섹션 */}
          <AnimatedSection className="features-section">
            {features.map((feature, index) => (
              <div key={index} className="feature-wrapper animate-target">
                <FeatureCard {...feature} />
              </div>
            ))}
          </AnimatedSection>

        {/* CTA(Call To Action) 섹션 - 비로그인 사용자에게만 표시 */}
        {!currentUser && (
          <AnimatedSection className="cta-section">
            <h2 className="cta-title">함께 배우고 성장하세요</h2>
            <p className="cta-text">
              오늘 StudyBuddy에 가입하고 스터디 그룹 활동을 시작해보세요!
            </p>
            <HeroButton 
              variant="primary"
              onClick={handleSignup}
              className="cta-button"
            >
              지금 가입하기
            </HeroButton>
          </AnimatedSection>
        )}
      </main>
    </div>
  );
};

export default HomePage;