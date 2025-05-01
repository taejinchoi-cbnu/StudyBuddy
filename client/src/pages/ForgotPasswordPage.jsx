import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthStyles.css';
import studyImage from '../assets/logoQuestion.png'; 

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('이메일로 비밀번호 재설정 안내가 발송되었습니다.');
    } catch (error) {
      console.error('Password reset error:', error);
      setError('비밀번호 재설정에 실패했습니다. 이메일 주소를 확인해주세요.');
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
        {message && <div className="auth-success">{message}</div>}
        
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
          
          <p className="auth-description">
            이메일 주소를 입력하시면 비밀번호 재설정 안내가 발송됩니다.
          </p>
          
          <div className="auth-buttons-container">
            <button 
              type="submit" 
              className="auth-button accent" 
              disabled={loading}
            >
              재설정
            </button>
            
            <Link to="/login" className="auth-button-link">
              <button type="button" className="auth-button primary">
                로그인으로
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;