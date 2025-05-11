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
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import CreateGroupPage from './pages/CreateGroupPage';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

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
        
        {/* 그룹 라우트 추가 */}
        <Route 
          path="/groups" 
          element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/groups/create" 
          element={
            <ProtectedRoute>
              <CreateGroupPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/groups/:groupId" 
          element={
            <ProtectedRoute>
              <GroupDetailPage />
            </ProtectedRoute>
          } 
        />
        
        {/* 채팅 및 스케줄 페이지 (향후 구현 예정) */}
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