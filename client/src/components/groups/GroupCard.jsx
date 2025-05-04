import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';

const GroupCard = ({ group, isMember }) => {
  const { darkMode } = useDarkMode();
  
  // 안전하게 그룹 데이터 처리
  if (!group) {
    return null;
  }
  
  // 그룹 생성 날짜 포맷팅
  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 정보 없음';
    
    // Firebase 타임스탬프 처리
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      // Firestore 타임스탬프 객체
      date = new Date(timestamp.seconds * 1000);
    } else {
      // 일반 Date 객체 또는 숫자형 타임스탬프
      date = new Date(timestamp);
    }
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return '날짜 정보 없음';
    }
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Card 
      className={`h-100 shadow-sm ${darkMode ? 'dark-mode' : ''}`}
      style={{ transition: 'transform 0.3s ease', cursor: 'pointer' }}
      as={Link}
      to={`/groups/${group.id}`}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Card.Title>{group.name || '제목 없음'}</Card.Title>
          {isMember && (
            <Badge bg="success" pill>참여중</Badge>
          )}
        </div>
        
        <Card.Text className="mb-2">
          {group.description 
            ? (group.description.length > 100
                ? `${group.description.substring(0, 100)}...`
                : group.description)
            : '설명 없음'}
        </Card.Text>
        
        <div className="mb-3">
          {group.subject && Array.isArray(group.subject) && group.subject.map(subject => (
            <Badge 
              key={subject} 
              bg="primary" 
              className="me-1 mb-1"
            >
              {subject}
            </Badge>
          ))}
        </div>
        
        <div className="mb-3">
          {group.tags && Array.isArray(group.tags) && group.tags.slice(0, 5).map(tag => (
            <Badge 
              key={tag} 
              bg="secondary" 
              className="me-1 mb-1"
            >
              {tag}
            </Badge>
          ))}
          {group.tags && Array.isArray(group.tags) && group.tags.length > 5 && (
            <Badge bg="light" text="dark">+{group.tags.length - 5}</Badge>
          )}
        </div>
        
        <div className="d-flex justify-content-between align-items-center mt-auto">
          <small className="text-muted">
            {group.memberCount || 1}명 참여 중
          </small>
          <small className="text-muted">
            {group.createdAt ? formatDate(group.createdAt) : '최근 생성됨'}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default GroupCard;