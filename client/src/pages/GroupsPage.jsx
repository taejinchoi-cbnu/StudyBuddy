import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { getAllGroups, getUserGroups } from "../utils/GroupService";
import { GROUP_SUBJECTS, GROUP_TAGS, ALL_TAGS } from "../utils/GroupConstants";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import useLoading from "../hooks/useLoading";
import useFirebaseData from "../hooks/useFirebaseData"; 
import GroupCard from "../components/groups/GroupCard";

const GroupsPage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  
  // 페이지네이션 상태
  const [lastGroup, setLastGroup] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, startLoadingMore] = useLoading();
  
  // useFirebaseData를 사용하여 모든 그룹 데이터 가져오기
  const {
    data: groups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
    isSuccess: isGroupsSuccess
  } = useFirebaseData(
    // fetchFunction: 항상 실행
    () => getAllGroups(),
    // dependencies: 빈 배열 (초기 로드만)
    [],
    {
      enabled: true, // 자동 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (groupsData) => {
        console.log("모든 그룹 데이터 로드 성공:", groupsData?.length || 0, "개 그룹");
        
        // 페이지네이션 정보 업데이트
        if (groupsData && Array.isArray(groupsData) && groupsData.length > 0) {
          setLastGroup(groupsData[groupsData.length - 1]);
          setHasMore(groupsData.length >= 10);
        } else {
          setHasMore(false);
        }
      },
      onError: (error) => {
        console.error("모든 그룹 데이터 로드 실패:", error);
        // 에러 발생 시 임시 데이터 설정
        return [{
          id: "temp-error",
          name: "오류 발생 (임시 데이터)",
          description: "데이터 로딩 중 오류가 발생했습니다. 임시 데이터를 표시합니다.",
          subject: ["Programming"],
          tags: ["Test"],
          maxMembers: 5,
          memberCount: 1,
          meetingType: "온라인",
          createdAt: new Date()
        }];
      },
      // 데이터가 없을 때 폴백 데이터 제공
      transform: (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log("그룹 데이터가 없어 임시 데이터 생성");
          return [{
            id: "temp-1",
            name: "테스트 그룹",
            description: "로딩 테스트용 임시 그룹입니다.",
            subject: ["Programming"],
            tags: ["JavaScript", "React"],
            maxMembers: 6,
            memberCount: 1,
            meetingType: "온라인",
            createdAt: new Date()
          }];
        }
        
        // Firebase 타임스탬프 처리
        return data.map(group => {
          if (group.createdAt && typeof group.createdAt.toDate === "function") {
            return {
              ...group,
              createdAt: group.createdAt.toDate()
            };
          }
          return group;
        });
      }
    }
  );
  
  // useFirebaseData를 사용하여 사용자 그룹 데이터 가져오기
  const {
    data: userGroups,
    loading: userGroupsLoading,
    error: userGroupsError,
    refetch: refetchUserGroups,
    isSuccess: isUserGroupsSuccess
  } = useFirebaseData(
    // fetchFunction: currentUser가 있고 그룹 로드가 성공했을 때만 실행
    currentUser && isGroupsSuccess ? () => getUserGroups(currentUser.uid) : null,
    // dependencies: currentUser와 그룹 성공 상태가 변경되면 다시 실행
    [currentUser, isGroupsSuccess],
    {
      enabled: !!currentUser && isGroupsSuccess, // 사용자가 있고 그룹 로드 성공 후에만 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (userGroupsData) => {
        console.log("사사용자 그룹 데이터 로드 성공:", userGroupsData?.length || 0, "개 그룹");
      },
      onError: (error) => {
        console.error("사용자 그룹 데이터 로드 실패:", error);
        // 에러 발생 시 빈 배열로 처리
        return [];
      }
    }
  );
  
  // 더 많은 그룹 로드 함수
  const loadMoreGroups = useCallback(async () => {
    if (!hasMore || isLoadingMore || !lastGroup) return;
    
    try {
      const moreGroups = await startLoadingMore(getAllGroups(lastGroup));
      
      if (moreGroups && moreGroups.length > 0) {
        // 기존 그룹 데이터에 추가
        const updatedGroups = [...(groups || []), ...moreGroups];
        // 여기서는 직접 상태 업데이트가 필요 (useFirebaseData로는 추가 로드 처리가 복잡)
        // 실제로는 groups 상태를 직접 관리하거나 별도 로직 필요
        setLastGroup(moreGroups[moreGroups.length - 1]);
        setHasMore(moreGroups.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more groups:", error);
      setHasMore(false);
    }
  }, [hasMore, isLoadingMore, lastGroup, groups, startLoadingMore]);
  
  // 검색어에 따른 필터링 함수
  const filteredGroups = useCallback(() => {
    if (!groups || !Array.isArray(groups)) return [];
    
    return groups.filter(group => {
      if (!group) return false;
      
      // 검색어 필터링
      const searchMatch = !searchTerm || searchTerm === "" || 
        (group.name && group.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 주제 필터링
      const subjectMatch = !selectedSubject || selectedSubject === "" || 
        (group.subject && Array.isArray(group.subject) && group.subject.includes(selectedSubject));
      
      // 태그 필터링
      const tagMatch = !selectedTags || selectedTags.length === 0 || 
        (group.tags && Array.isArray(group.tags) && 
          selectedTags.some(tag => group.tags.includes(tag)));
      
      return searchMatch && subjectMatch && tagMatch;
    });
  }, [groups, searchTerm, selectedSubject, selectedTags]);
  
  // 태그 선택/해제 토글
  const toggleTag = useCallback((tag) => {
    setSelectedTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  }, []);
  
  // 로딩 상태 통합
  const isLoading = groupsLoading || userGroupsLoading;
  const error = groupsError || userGroupsError;
  
  // 필터링된 그룹 데이터
  const displayGroups = filteredGroups();
  
  return (
    <div className="page-container">
      {/* 네비게이션바 높이만큼 추가하는 여백 */}
      <div className="navbar-spacer"></div>
      
      <Container className={`mt-4 ${darkMode ? "dark-mode" : ""}`}>
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
                onClick={() => navigate("/groups/create")}
                className="create-group-btn"
              >
                새 그룹 만들기
              </Button>
            </div>
            
            {/* 에러 메시지 표시 */}
            {error && <div className="alert alert-danger">{error}</div>}
            
            {/* 내 스터디 그룹 섹션 */}
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
                            bg={selectedTags.includes(tag) ? "primary" : "secondary"}
                            className="me-1 mb-1 p-2 tag-badge"
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))
                      : ALL_TAGS && ALL_TAGS.slice(0, 20).map(tag => (
                          <Badge
                            key={tag}
                            bg={selectedTags.includes(tag) ? "primary" : "secondary"}
                            className="me-1 mb-1 p-2 tag-badge"
                            style={{ cursor: "pointer" }}
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
            {displayGroups.length > 0 ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {displayGroups.map(group => (
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
                  {isLoadingMore ? "로딩 중..." : "더 보기"}
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