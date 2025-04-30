import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthStyles.css'; // 공통 CSS 파일 경로
import studyImage from '../assets/loginLogo.gif'; // 이미지 경로 확인 필요

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    
    if (password.length < 6) {
      return setError('Password should be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName);
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already in use');
      } else {
        setError('Failed to create an account');
      }
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
            <label htmlFor="displayName" className="input-label">이름</label>
            <input
              type="text"
              id="displayName"
              className="input-field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          
          <div className="input-field-container">
            <label htmlFor="email" className="input-label">이메일 주소</label>
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
          
          <div className="input-field-container">
            <label htmlFor="password-confirm" className="input-label">비밀번호 확인</label>
            <input
              type="password"
              id="password-confirm"
              className="input-field"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </div>
          
          <div className="auth-buttons-container">
            <button 
              type="submit" 
              className="auth-button primary" 
              disabled={loading}
            >
              회원가입
            </button>
            
            <p className="auth-text">이미 계정이 있으신가요?</p>
            <Link to="/login" className="auth-link">
              로그인하기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;