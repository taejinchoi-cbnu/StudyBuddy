import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/MainStyles.css';

const HomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="main-layout home-page">
      {/* 메인 콘텐츠 */}
      <main className="main-content">
        {/* 히어로 섹션 */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Study Smarter, Together</h1>
            <p className="hero-text">
              StudyBuddy helps you connect with other students, form study groups, find common meeting times, and achieve better results!
            </p>
            {currentUser ? (
              <Link to="/dashboard" className="hero-button">
                Go to Dashboard
              </Link>
            ) : (
              <div className="hero-buttons">
                <Link to="/signup" className="hero-button accent">
                  Get Started
                </Link>
                <Link to="/login" className="hero-button">
                  Log In
                </Link>
              </div>
            )}
          </div>
          <div className="hero-image-container">
            <img 
              src="/path-to-image.jpg" 
              alt="StudyBuddy illustration" 
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
            <h3 className="feature-title">Find Study Partners</h3>
            <p className="feature-text">Connect with students who share your academic interests and goals</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>📅</span>
            </div>
            <h3 className="feature-title">Schedule Sessions</h3>
            <p className="feature-text">Easily find common availability and schedule study sessions</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <span>💬</span>
            </div>
            <h3 className="feature-title">Collaborate</h3>
            <p className="feature-text">Chat in real-time and share resources with your study group</p>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="cta-section">
          <h2 className="cta-title">Ready to boost your academic success?</h2>
          <p className="cta-text">Join StudyBuddy today and start collaborating!</p>
          {!currentUser && (
            <Link to="/signup" className="cta-button accent">
              Sign Up Now
            </Link>
          )}
        </section>
      </main>

      {/* 하단 네비게이션 바 */}
      <nav className="bottom-navbar">
        <Link to="/" className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span className="nav-text">홈</span>
        </Link>
        <Link to="/groups" className="nav-item">
          <span className="nav-icon">👨‍👩‍👧‍👦</span>
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
      </nav>
    </div>
  );
};

export default HomePage;