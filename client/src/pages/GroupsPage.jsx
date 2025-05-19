import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, InputGroup, FormControl } from 'react-bootstrap';
import { getAllGroups, getUserGroups } from '../utils/GroupService';
import { GROUP_SUBJECTS, GROUP_TAGS, ALL_TAGS } from '../utils/GroupConstants';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import useLoading from '../hooks/UseLoading';
import GroupCard from '../components/groups/GroupCard';

const GroupsPage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [lastGroup, setLastGroup] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, startLoadingMore] = useLoading();
  const [error, setError] = useState('');
  
  // 초기 그룹 데이터 로드
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        console.log("Fetching groups...");
        setIsLoading(true);
        
        // 실제 API 호출
        const fetchedGroups = await getAllGroups();
        
        if (!isMounted) return;
        
        console.log("Fetched groups:", fetchedGroups);
        
        // 데이터 처리
        if (fetchedGroups && Array.isArray(fetchedGroups) && fetchedGroups.length > 0) {
          setGroups(fetchedGroups);
          setLastGroup(fetchedGroups[fetchedGroups.length - 1]);
          setHasMore(fetchedGroups.length >= 10);
        } else {
          // 그룹 데이터가 없는 경우 보여주는 test 그룹
          console.log("No groups found or empty array, using fallback data");
          const tempGroups = [
            {
              id: 'temp-1',
              name: '테스트 그룹',
              description: '로딩 테스트용 임시 그룹입니다.',
              subject: ['Programming'],
              tags: ['JavaScript', 'React'],
              maxMembers: 6,
              memberCount: 1,
              meetingType: '온라인',
              createdAt: new Date()
            }
          ];
          setGroups(tempGroups);
          setHasMore(false);
        }
        
        // 사용자가 속한 그룹 가져오기
        if (currentUser) {
          try {
            const fetchedUserGroups = await getUserGroups(currentUser.uid);
            if (isMounted) {
              if (fetchedUserGroups && Array.isArray(fetchedUserGroups)) {
                setUserGroups(fetchedUserGroups);
              } else {
                setUserGroups([]);
              }
            }
          } catch (userGroupsError) {
            console.error('Error fetching user groups:', userGroupsError);
            if (isMounted) {
              setUserGroups([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        
        if (!isMounted) return;
        
        setError('그룹 정보를 불러오는 데 실패했습니다.');
        // 오류 발생 시 보여주는 임시 데이터
        const tempGroups = [
          {
            id: 'temp-error',
            name: '오류 발생 (임시 데이터)',
            description: '데이터 로딩 중 오류가 발생했습니다. 임시 데이터를 표시합니다.',
            subject: ['Programming'],
            tags: ['Test'],
            maxMembers: 5,
            memberCount: 1,
            meetingType: '온라인',
            createdAt: new Date()
          }
        ];
        setGroups(tempGroups);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log("Loading finished");
        }
      }
    };

    fetchInitialData();

    // 클린업 함수
    return () => {
      isMounted = false;
    };
  }, [currentUser]);
  
  // 더 많은 그룹 로드
  const loadMoreGroups = async () => {
    if (!hasMore || isLoadingMore || !lastGroup) return;
    
    try {
      const moreGroups = await startLoadingMore(getAllGroups(lastGroup));
      
      if (moreGroups && moreGroups.length > 0) {
        setGroups(prevGroups => [...prevGroups, ...moreGroups]);
        setLastGroup(moreGroups[moreGroups.length - 1]);
        setHasMore(moreGroups.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more groups:', error);
      setError('추가 그룹을 불러오는 데 실패했습니다.');
      setHasMore(false);
    }
  };
  
  // 검색어에 따른 필터링 - 안전하게 처리
  const filteredGroups = groups && Array.isArray(groups) 
    ? groups.filter(group => {
        if (!group) return false;
        
        // 검색어 필터링
        const searchMatch = !searchTerm || searchTerm === '' || 
          (group.name && group.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // 주제 필터링
        const subjectMatch = !selectedSubject || selectedSubject === '' || 
          (group.subject && Array.isArray(group.subject) && group.subject.includes(selectedSubject));
        
        // 태그 필터링
        const tagMatch = !selectedTags || selectedTags.length === 0 || 
          (group.tags && Array.isArray(group.tags) && 
            selectedTags.some(tag => group.tags.includes(tag)));
        
        return searchMatch && subjectMatch && tagMatch;
      })
    : [];
  
  // 태그 선택/해제 토글
  const toggleTag = (tag) => {
    setSelectedTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  };
  
  return (
    // NavBar 높이만큼 상단 여백 추가
    <div className="page-container">
      {/* 네비게이션바 높이만큼 추가하는 여백 */}
      <div className="navbar-spacer"></div>
      
      <Container className={`mt-4 ${darkMode ? 'dark-mode' : ''}`}>
        {/* 로딩 상태 명시적 처리 */}
        {isLoading ? (
          <div className="text-center py-5">
            <LoadingSpinner />
            <p className="mt-3">그룹 정보를 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>스터디 그룹</h1>
              <Button 
                variant="primary" 
                onClick={() => navigate('/groups/create')}
                className="create-group-btn"
              >
                새 그룹 만들기
              </Button>
            </div>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            {currentUser && userGroups && userGroups.length > 0 && (
              <>
                <h3 className="mb-3">내 스터디 그룹</h3>
                <Row xs={1} md={2} lg={3} className="g-4 mb-5">
                  {userGroups.map(group => (
                    <Col key={group.id}>
                      <GroupCard group={group} isMember={true} />
                    </Col>
                  ))}
                </Row>
              </>
            )}
            
            <h3 className="mb-3">모든 스터디 그룹</h3>
            
            {/* 검색 및 필터 */}
            <Card className="mb-4">
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <InputGroup>
                      <FormControl
                        placeholder="그룹 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <InputGroup>
                      <InputGroup.Text>주제</InputGroup.Text>
                      <FormControl
                        as="select"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        <option value="">모든 주제</option>
                        {GROUP_SUBJECTS && GROUP_SUBJECTS.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </FormControl>
                    </InputGroup>
                  </Col>
                </Row>
                
                <div>
                  <p className="mb-2">태그 필터:</p>
                  <div className="tags-container">
                    {selectedSubject && GROUP_TAGS && GROUP_TAGS[selectedSubject]
                      ? (GROUP_TAGS[selectedSubject] || []).map(tag => (
                          <Badge
                            key={tag}
                            bg={selectedTags.includes(tag) ? 'primary' : 'secondary'}
                            className="me-1 mb-1 p-2 tag-badge"
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))
                      : ALL_TAGS && ALL_TAGS.slice(0, 20).map(tag => (
                          <Badge
                            key={tag}
                            bg={selectedTags.includes(tag) ? 'primary' : 'secondary'}
                            className="me-1 mb-1 p-2 tag-badge"
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))
                    }
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            {/* 그룹 목록 */}
            {filteredGroups.length > 0 ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredGroups.map(group => (
                  <Col key={group.id}>
                    <GroupCard 
                      group={group} 
                      isMember={userGroups && userGroups.some(g => g.id === group.id)} 
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center my-5">
                <p>검색 조건에 맞는 그룹이 없습니다.</p>
              </div>
            )}
            
            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="text-center mt-4 mb-5">
                <Button 
                  variant="outline-primary" 
                  onClick={loadMoreGroups}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default GroupsPage;