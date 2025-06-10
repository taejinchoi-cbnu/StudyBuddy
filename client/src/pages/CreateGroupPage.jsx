import { Container } from 'react-bootstrap';
import { useDarkMode } from '../contexts/DarkModeContext';
import CreateGroupForm from '../components/groups/CreateGroupForm';

const CreateGroupPage = () => {
  const { darkMode } = useDarkMode();
  
  return (
    <div className={`main-layout create-group-page ${darkMode ? "dark-mode" : ""}`}>
      {/* 메인 콘텐츠 영역 */}
      <main className="main-content">
        <Container className={`create-group-container ${darkMode ? "dark-mode" : ""}`}>
          <CreateGroupForm />
        </Container>
      </main>
    </div>
  );
};

export default CreateGroupPage;