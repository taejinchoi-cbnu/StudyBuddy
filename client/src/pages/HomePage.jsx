import { useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import AppNavbar from '../components/AppNavbar';
import logoHome from '../assets/logoHome.png';
import logoSmall from '../assets/logoSmall.png';
import logoHello from '../assets/logoHello.png';
import calendar from '../assets/calendar.png';
import peoples from '../assets/peoples.png';

const HomePage = () => {
  // 컨텍스트 및 훅 사용
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  // AppNavbar에 대한 참조 생성 (모달 제어용)
  const navbarRef = useRef();

  // 애니메이션 섹션 참조
  const serviceIntroRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

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
    navigate('/dashboard');
  }, [navigate]);

  // 특징 섹션 데이터
  const features = [
    {
      imgSrc: peoples,
      imgAlt: '파트너 찾기',
      title: '파트너 찾기',
      description:
        '같은 목표를 가진 학생들과 팀을 이루고 함께 성장해보세요. 관심사와 목표가 맞는 팀원을 쉽게 찾을 수 있습니다.',
      benefits: [
        '관심사 기반 매칭',
        '목표 지향적 팀 구성',
        '지속적인 동기 부여',
      ],
    },
    {
      imgSrc: calendar,
      imgAlt: '스마트 일정 조율',
      title: '스마트 일정 조율',
      description:
        '스케줄 맞추기의 고민을 덜어드립니다. 스케줄 자동 분석으로 모두에게 최적화된 미팅 시간을 제안합니다.',
      benefits: ['자동 시간 분석', '최적 시간 추천', '실시간 스케줄 동기화'],
    },
  ];

  // 애니메이션 섹션 처리
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 섹션 자체에 애니메이션 클래스 추가
          entry.target.classList.add('animate-in');

          // animate-target 클래스를 가진 자식 요소들에도 애니메이션 적용
          const animateTargets =
            entry.target.querySelectorAll('.feature-wrapper');
          animateTargets.forEach((target, index) => {
            setTimeout(() => {
              target.classList.add('animate-in');
            }, index * 200); // 순차적 애니메이션
          });
        }
      },
      { threshold: 0.5 },
    );

    // 각 섹션 관찰 시작
    [serviceIntroRef, featuresRef, ctaRef].forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      // 컴포넌트 언마운트 시 관찰 중단
      [serviceIntroRef, featuresRef, ctaRef].forEach((ref) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  // HeroButton 컴포넌트 직접 구현
  const renderHeroButton = (variant, onClick, children, className = '') => {
    const baseClass = 'hero-button';
    const variantClass = `${baseClass}-${variant}`;
    const darkModeClass = darkMode ? 'dark-mode' : '';

    return (
      <button
        type="button"
        className={`${baseClass} ${variantClass} ${darkModeClass} ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

  // FeatureCard 컴포넌트 직접 구현
  const renderFeatureCard = (feature, index) => (
    <div key={index} className={`feature-card ${darkMode ? 'dark-mode' : ''}`}>
      <div className="feature-card-image">
        <img
          src={feature.imgSrc}
          alt={feature.imgAlt}
          className="feature-image"
        />
      </div>
      <div className="feature-card-content">
        <h3 className="feature-card-title">{feature.title}</h3>
        <p className="feature-card-description">{feature.description}</p>

        {feature.benefits && (
          <div className="feature-card-benefits">
            {feature.benefits.map((benefit, benefitIndex) => (
              <div key={benefitIndex} className="benefit-item">
                <div className="benefit-icon">✓</div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`main-layout home-page ${darkMode ? 'dark-mode' : ''}`}>
      {/* 네비게이션 바 */}
      <div
        className="transparent-navbar-wrapper"
        style={{ position: 'absolute', zIndex: 1050 }}
      >
        <AppNavbar transparent={true} ref={navbarRef} />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <main className="main-content">
        {/* 히어로 섹션 - 메인 랜딩 영역 */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text-section">
              <h1 className="hero-title">
                Welcome
                <br />
                <span className="hero-title-highlight">to</span>
                <br />
                Study Buddy
              </h1>
              <p className="hero-description">
                같은 꿈을 꾸는 우리가 만나는 곳, StudyBuddy에서
                <br />
                함께 성장하고 목표를 달성해보세요.
              </p>

              {/* 로그인 상태에 따른 버튼 표시 */}
              <div className="hero-buttons">
                {currentUser ? (
                  renderHeroButton(
                    'primary',
                    navigateToDashboard,
                    '대시보드로 이동',
                  )
                ) : (
                  <>
                    {renderHeroButton('primary', handleSignup, '시작하기')}
                    {renderHeroButton('secondary', handleLogin, '로그인')}
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
        <section
          ref={serviceIntroRef}
          className={`animated-section service-intro-section ${darkMode ? 'dark-mode' : ''}`}
        >
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
                적절한 팀원을 구하는게 어려웠는데,
                <br />
                스터디 버디로 해결했어요!
              </h2>
            </div>
            <div className="service-testimonials">
              <div className="testimonial-avatars">
                <div className="testimonial-avatar">
                  <img
                    src={logoHello}
                    alt="사용자 후기 1"
                    className="avatar-image"
                  />
                </div>
              </div>
              <div className="testimonial-content">
                <span className="testimonial-rating">평점: ★★★★★</span>
              </div>
            </div>
          </div>
        </section>

        {/* 주요 특징 섹션 */}
        <section
          ref={featuresRef}
          className={`animated-section features-section ${darkMode ? 'dark-mode' : ''}`}
        >
          {features.map((feature, index) => (
            <div key={index} className="feature-wrapper animate-target">
              {renderFeatureCard(feature, index)}
            </div>
          ))}
        </section>

        {/* CTA(Call To Action) 섹션 - 비로그인 사용자에게만 표시 */}
        {!currentUser && (
          <section
            ref={ctaRef}
            className={`animated-section cta-section ${darkMode ? 'dark-mode' : ''}`}
          >
            <h2 className="cta-title">함께 배우고 성장하세요</h2>
            <p className="cta-text">
              오늘 StudyBuddy에 가입하고 스터디 그룹 활동을 시작해보세요!
            </p>
            {renderHeroButton(
              'primary',
              handleSignup,
              '지금 가입하기',
              'cta-button',
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default HomePage;
