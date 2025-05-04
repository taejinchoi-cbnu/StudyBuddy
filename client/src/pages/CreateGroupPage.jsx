import { Container } from 'react-bootstrap';
import { useDarkMode } from '../contexts/DarkModeContext';
import CreateGroupForm from '../components/groups/CreateGroupForm';

const CreateGroupPage = () => {
  const { darkMode } = useDarkMode();
  
  return (
    <Container className={`my-4 ${darkMode ? 'dark-mode' : ''}`}>
      <CreateGroupForm />
    </Container>
  );
};

export default CreateGroupPage;