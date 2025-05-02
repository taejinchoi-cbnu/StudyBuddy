import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import AppNavbar from './components/Navbar';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 홈페이지에만 NavBar 표시 */}
          <Route path="/" element={
            <>
              <AppNavbar />
              <HomePage />
            </>
          } />
          
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
          
          {/* Redirect for any other paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;