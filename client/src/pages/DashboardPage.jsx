import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext'; 
import useLoading from '../hooks/UseLoading';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // useLoading 적용
  const [isLoading, startLoading] = useLoading();

  if (!currentUser || !userProfile) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* 로딩 오버레이 추가 */}
      {isLoading && <LoadingSpinner />}
      
      <div className={`dashboard-layout ${darkMode ? 'dark-mode' : ''}`}>
        {/* AppNavbar는 App.jsx에서 이미 렌더링되므로 제거 */}
        {/* AppNavbar 컴포넌트를 사용하여 일관된 네비게이션 바 표시 */}
        
        <div className="main-area-full">
          <div className="navbar-spacer"></div>
          
          {/* 대시보드 내용 */}
          <main className="dashboard-content">
            {error && <div className="main-error">{error}</div>}
            
            {/* 스터디 시간 차트 */}
            <div className="study-chart-container">
              <div className="chart-card">
                <h3 className="card-title">스터디 시간을 보여주는 chart</h3>
                <div className="chart-content">
                  {/* 차트가 들어갈 영역 */}
                </div>
              </div>
            </div>
            
            <div className="dashboard-grid">
              {/* 스터디 그룹 카드 */}
              <div className="dashboard-card">
                <h3 className="card-title">간단한 할 일 input</h3>
                <div className="card-content">
                  <p>체크 클릭 시 middle-line이 생기고 X누를 시 사라짐</p>
                </div>
              </div>
              
              {/* 일정 카드 */}
              <div className="dashboard-card">
                <h3 className="card-title">내 스터디 그룹</h3>
                <div className="card-content">
                  <p>기존과 동일 size만 변경</p>
                </div>
              </div>
              
              {/* 알림 카드 */}
              <div className="dashboard-card">
                <h3 className="card-title">최근 알림</h3>
                <div className="card-content">
                  <p>기존과 동일 size만 변경</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;