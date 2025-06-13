import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, ListGroup, Badge } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';

const GroupMembersList = ({ members, isAdmin, currentUser }) => {
  const { darkMode } = useDarkMode();
  const [memberProfiles, setMemberProfiles] = useState({});

  // 멤버 프로필 정보 가져오기
  useEffect(() => {
    const fetchMemberProfiles = async () => {
      const profiles = {};

      for (const member of members) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', member.userId));
          if (userDoc.exists()) {
            profiles[member.userId] = userDoc.data();
          }
        } catch {
          // 프로필 로드 실패 시 무시
        }
      }

      setMemberProfiles(profiles);
    };

    if (members.length > 0) {
      fetchMemberProfiles();
    }
  }, [members]);

  return (
    <Card className={`shadow-sm ${darkMode ? 'dark-mode' : ''}`}>
      <Card.Body>
        <h3 className="mb-3">멤버 ({members.length})</h3>

        <ListGroup>
          {members.map((member) => {
            const profile = memberProfiles[member.userId] || {};
            const isCurrentUser =
              currentUser && member.userId === currentUser.uid;

            return (
              <ListGroup.Item
                key={member.userId}
                className={`d-flex justify-content-between align-items-center ${darkMode ? 'dark-mode' : ''}`}
              >
                <div>
                  <Link
                    to={`/users/${member.userId}`}
                    className="text-decoration-none"
                  >
                    <strong>{profile.displayName || '사용자'}</strong>
                  </Link>
                  {isCurrentUser && <span className="ms-2">(나)</span>}
                </div>

                <div>
                  <Badge bg={member.role === 'admin' ? 'danger' : 'info'}>
                    {member.role === 'admin' ? '관리자' : '멤버'}
                  </Badge>
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default GroupMembersList;
