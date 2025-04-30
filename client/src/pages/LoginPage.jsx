import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthStyles.css'; // 공통 CSS 파일 경로
import studyImage from '../assets/loginLogo.gif'; // 이미지 경로 확인 필요

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-section">
        <img src={studyImage} alt="Students studying" className="auth-image" />
      </div>
      <div className="auth-right-section">
        <div className="auth-logo-container">
          <h1 className="auth-logo">StudyBuddy</h1>
          <p className="auth-tagline">함께 공부하는 즐거움</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-field-container">
            <label htmlFor="email" className="input-label">이메일</label>
            <input
              type="email"
              id="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-field-container">
            <label htmlFor="password" className="input-label">비밀번호</label>
            <input
              type="password"
              id="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="auth-buttons-container">
            <Link to="/signup" className="auth-button-link">
              <button type="button" className="auth-button primary">
                회원가입
              </button>
            </Link>
            
            <button 
              type="submit" 
              className="auth-button primary" 
              disabled={loading}
            >
              로그인
            </button>
            
            <Link to="/forgot-password" className="auth-link">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;