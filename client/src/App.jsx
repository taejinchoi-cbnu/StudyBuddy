import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';

// Components
import AppNavbar from './components/AppNavbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap Icons CSS
import 'bootstrap-icons/font/bootstrap-icons.css';
// Import custom styles
import './index.css';

// NavBar 렌더링을 위한 래퍼 컴포넌트
const AppWithNavbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <AuthProvider>
      {/* 홈페이지가 아닐 때만 NavBar 표시 */}
      {!isHomePage && <AppNavbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        {/* 그룹 및 스케줄 페이지는 2주차, 3주차에 구현 예정 */}
        <Route 
          path="/groups/*" 
          element={
            <ProtectedRoute>
              <DashboardPage /> {/* 임시로 대시보드로 리다이렉트 */}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/chat/*" 
          element={
            <ProtectedRoute>
              <DashboardPage /> {/* 임시로 대시보드로 리다이렉트 */}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/schedule/*" 
          element={
            <ProtectedRoute>
              <DashboardPage /> {/* 임시로 대시보드로 리다이렉트 */}
            </ProtectedRoute>
          } 
        />
        
        {/* 잘못된 경로로 이동하면 Home으로 보내기 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <AppWithNavbar />
      </Router>
    </DarkModeProvider>
  );
}

export default App;