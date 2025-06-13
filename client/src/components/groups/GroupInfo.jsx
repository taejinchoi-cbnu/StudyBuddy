import { Card } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';

const GroupInfo = ({ group, isAdmin }) => {
  const { darkMode } = useDarkMode();

  return (
    <Card className={`shadow-sm ${darkMode ? 'dark-mode' : ''}`}>
      <Card.Body>
        <h3 className="mb-3">그룹 소개</h3>
        <p className="mb-4">{group.description}</p>

        <h4 className="mb-2">정보</h4>
        <ul>
          <li>미팅 방식: {group.meetingType}</li>
          <li>최대 인원: {group.maxMembers}명</li>
          <li>현재 인원: {group.memberCount || 1}명</li>
        </ul>
      </Card.Body>
    </Card>
  );
};

export default GroupInfo;
