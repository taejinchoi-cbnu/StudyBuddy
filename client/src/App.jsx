import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import AppNavbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap Icons CSS
import 'bootstrap-icons/font/bootstrap-icons.css';
// Import custom styles
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppNavbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
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
            path="/groups" 
            element={
              <ProtectedRoute>
                <DashboardPage /> {/* 임시로 대시보드로 리다이렉트 */}
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/schedule" 
            element={
              <ProtectedRoute>
                <DashboardPage /> {/* 임시로 대시보드로 리다이렉트 */}
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect for any other paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;