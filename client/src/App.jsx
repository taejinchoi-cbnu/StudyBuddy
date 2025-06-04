import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { useAuth } from './contexts/AuthContext';

// Components
import AppNavbar from './components/AppNavbar';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import CreateGroupPage from './pages/CreateGroupPage';
import SchedulePage from './pages/SchedulePage';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// ProtectedRoute 컴포넌트를 App.jsx에 통합
const ProtectedElement = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
};

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
            <ProtectedElement>
              <DashboardPage />
            </ProtectedElement>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedElement>
              <ProfilePage />
            </ProtectedElement>
          } 
        />
        
        {/* 그룹 라우트 추가 */}
        <Route 
          path="/groups" 
          element={
            <ProtectedElement>
              <GroupsPage />
            </ProtectedElement>
          } 
        />
        
        <Route 
          path="/groups/create" 
          element={
            <ProtectedElement>
              <CreateGroupPage />
            </ProtectedElement>
          } 
        />
        
        <Route 
          path="/groups/:groupId" 
          element={
            <ProtectedElement>
              <GroupDetailPage />
            </ProtectedElement>
          } 
        />
        
        <Route 
          path="/schedule" 
          element={
            <ProtectedElement>
              <SchedulePage />
            </ProtectedElement>
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