import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { getAllGroups, getUserGroups } from "../utils/GroupService";
import { GROUP_SUBJECTS, GROUP_TAGS, ALL_TAGS } from "../utils/GroupConstants";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import useLoading from "../hooks/useLoading";
import useFirebaseData from "../hooks/useFirebaseData"; 
import GroupCard from "../components/groups/GroupCard";
import DashboardCard from "../components/common/DashboardCard";
import ListItem from "../components/common/ListItem";

const GroupsPage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  
  // 애니메이션 상태
  const [isFilterAnimating, setIsFilterAnimating] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 페이지네이션 상태 - 실제 표시될 그룹 목록 관리
  const [displayedGroups, setDisplayedGroups] = useState([]);
  const [lastGroup, setLastGroup] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, startLoadingMore] = useLoading();
  
  // fetchFunction들을 useCallback으로 메모이제이션 (무한 루프 방지)
  const fetchAllGroups = useCallback(() => {
    return getAllGroups();
  }, []);

  const fetchUserGroups = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserGroups(currentUser.uid);
  }, [currentUser]);
  
  // useFirebaseData를 사용하여 모든 그룹 데이터 가져오기
  const {
    data: groups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
    isSuccess: isGroupsSuccess
  } = useFirebaseData(
    // fetchFunction: 메모이제이션된 함수 사용
    fetchAllGroups,
    // dependencies: 빈 배열 (초기 로드만)
    [],
    {
      enabled: true, // 자동 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (groupsData) => {
        console.log("모든 그룹 데이터 로드 성공:", groupsData?.length || 0, "개 그룹");
        
        // 초기 그룹 데이터를 displayedGroups에 설정
        if (groupsData && Array.isArray(groupsData)) {
          setDisplayedGroups(groupsData);
          
          // 페이지네이션 정보 업데이트
          if (groupsData.length > 0) {
            setLastGroup(groupsData[groupsData.length - 1]);
            setHasMore(groupsData.length >= 10);
          } else {
            setHasMore(false);
          }
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
    // fetchFunction: 메모이제이션된 함수 사용
    fetchUserGroups,
    // dependencies: currentUser가 변경되면 다시 실행
    [currentUser],
    {
      enabled: !!currentUser && isGroupsSuccess, // 사용자가 있고 그룹 로드 성공 후에만 실행
      initialData: [], // 초기값을 빈 배열로 설정
      onSuccess: (userGroupsData) => {
        console.log("사용자 그룹 데이터 로드 성공:", userGroupsData?.length || 0, "개 그룹");
      },
      onError: (error) => {
        console.error("사용자 그룹 데이터 로드 실패:", error);
        // 에러 발생 시 빈 배열로 처리
        return [];
      }
    }
  );
  
  // 데이터 새로고침 함수
  const refreshData = useCallback(async () => {
    try {
      console.log("그룹 데이터 새로고침 시작");
      
      // 페이지네이션 상태 초기화
      setDisplayedGroups([]);
      setLastGroup(null);
      setHasMore(true);
      
      // 데이터 새로고침
      await refetchGroups();
      await refetchUserGroups();
    } catch (error) {
      console.error("그룹 데이터 새로고침 실패:", error);
    }
  }, [refetchGroups, refetchUserGroups]);

  // 더 많은 그룹 로드 함수
  const loadMoreGroups = useCallback(async () => {
    if (!hasMore || isLoadingMore || !lastGroup) {
      console.log("더보기 조건 불만족:", { hasMore, isLoadingMore, lastGroup: !!lastGroup });
      return;
    }
    
    try {
      console.log("더보기 요청 시작, lastGroup:", lastGroup.id);
      const moreGroups = await startLoadingMore(getAllGroups(lastGroup, 10));
      console.log("더보기 결과:", moreGroups?.length || 0, "개 그룹");
      
      if (moreGroups && moreGroups.length > 0) {
        // Firebase 타임스탬프 처리
        const processedGroups = moreGroups.map(group => {
          if (group.createdAt && typeof group.createdAt.toDate === "function") {
            return {
              ...group,
              createdAt: group.createdAt.toDate()
            };
          }
          return group;
        });
        
        // 기존 그룹 목록에 새 그룹들 추가
        setDisplayedGroups(prevGroups => [...prevGroups, ...processedGroups]);
        
        // 페이지네이션 상태 업데이트
        setLastGroup(processedGroups[processedGroups.length - 1]);
        setHasMore(processedGroups.length >= 10);
        
        console.log("더보기 완료, 총 그룹 수:", displayedGroups.length + processedGroups.length);
      } else {
        console.log("더 이상 로드할 그룹이 없음");
        setHasMore(false);
      }
    } catch (error) {
      console.error("더보기 로드 오류:", error);
      setHasMore(false);
    }
  }, [hasMore, isLoadingMore, lastGroup, startLoadingMore, displayedGroups.length]);
  
  // 검색어에 따른 필터링 함수 (애니메이션 포함)
  const filteredGroups = useCallback(() => {
    // displayedGroups를 사용하여 필터링 (더보기로 로드된 그룹들 포함)
    if (!displayedGroups || !Array.isArray(displayedGroups)) return [];
    
    // 사용자가 참여중인 그룹 ID 목록
    const joinedGroupIds = userGroups ? userGroups.map(group => group.id) : [];
    
    const filtered = displayedGroups.filter(group => {
      if (!group) return false;
      
      // 이미 참여중인 그룹은 제외
      if (joinedGroupIds.includes(group.id)) return false;
      
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
    
    return filtered;
  }, [displayedGroups, searchTerm, selectedSubject, selectedTags, userGroups]);

  // 검색 결과 업데이트 (디바운스 포함)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      setIsFilterAnimating(true);
      
      const results = filteredGroups();
      
      // 검색 애니메이션 효과
      setTimeout(() => {
        setSearchResults(results);
        setIsSearching(false);
        
        // 필터 애니메이션 완료
        setTimeout(() => {
          setIsFilterAnimating(false);
        }, 300);
      }, 300);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [filteredGroups]);

  // 검색어 변경 핸들러 (애니메이션 포함)
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setIsFilterAnimating(true);
  }, []);

  // 주제 변경 핸들러 (애니메이션 포함)
  const handleSubjectChange = useCallback((value) => {
    setSelectedSubject(value);
    setIsFilterAnimating(true);
    // 주제 변경 시 관련 없는 태그 제거
    if (value && GROUP_TAGS[value]) {
      setSelectedTags(prevTags => 
        prevTags.filter(tag => GROUP_TAGS[value].includes(tag))
      );
    }
  }, []);
  
  // 그룹 카드 클릭 핸들러
  const handleGroupClick = useCallback((groupId) => {
    navigate(`/groups/${groupId}`);
  }, [navigate]);

  // 그룹 날짜 포맷팅 함수
  const formatGroupDate = useCallback((createdAt) => {
    if (!createdAt) return "최근 생성됨";
    
    let date;
    if (createdAt.toDate && typeof createdAt.toDate === "function") {
      date = createdAt.toDate();
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    
    if (isNaN(date.getTime())) {
      return "날짜 정보 없음";
    }
    
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    });
  }, []);

  // 그룹 설명 요약 함수
  const getSummaryDescription = useCallback((description, maxLength = 80) => {
    if (!description) return "설명 없음";
    return description.length > maxLength 
      ? `${description.substring(0, maxLength)}...` 
      : description;
  }, []);

  // 태그 선택/해제 토글 (애니메이션 포함)
  const toggleTag = useCallback((tag) => {
    setIsFilterAnimating(true);
    setSelectedTags(prevTags => 
      prevTags.includes(tag)
        ? prevTags.filter(t => t !== tag)
        : [...prevTags, tag]
    );
  }, []);
  
  // 로딩 상태 통합
  const isLoading = groupsLoading || userGroupsLoading;
  const error = groupsError || userGroupsError;
  
  // 필터링된 그룹 데이터 (검색 결과 우선 사용)
  const displayGroups = isFilterAnimating ? searchResults : (searchResults.length > 0 ? searchResults : filteredGroups());
  
  // 디버깅을 위한 로그
  useEffect(() => {
    console.log("상태 업데이트:", {
      displayedGroupsCount: displayedGroups.length,
      filteredCount: filteredGroups().length,
      hasMore,
      lastGroup: lastGroup?.id
    });
  }, [displayedGroups.length, filteredGroups, hasMore, lastGroup]);
  
  return (
    <div className={`page-container ${darkMode ? "dark-mode" : ""}`}>
      {/* 네비게이션바 */}
      <div className="navbar-spacer"></div>
      
      <Container className={`mt-4 ${darkMode ? "dark-mode" : ""}`}>
        {/* 로딩 상태 */}
        {isLoading ? (
          <div className="text-center py-5">
            <LoadingSpinner />
            <p className="mt-3">그룹 정보를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 페이지 헤더 */}
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
                <div className="my-groups-list mb-5">
                  {userGroups.map(group => (
                    <ListItem
                      key={group.id}
                      variant="my-group"
                      onClick={() => handleGroupClick(group.id)}
                      title={group.name || "제목 없음"}
                      subtitle={
                        <div className="my-group-details">
                          <div className="group-description-short mb-1">
                            {getSummaryDescription(group.description, 60)}
                          </div>
                          <div className="group-meta-info">
                            <span className="member-count">
                              <i className="bi bi-people me-1"></i>
                              {group.memberCount || 1}/{group.maxMembers}명
                            </span>
                            <span className="meeting-type ms-3">
                              <i className="bi bi-geo-alt me-1"></i>
                              {group.meetingType}
                            </span>
                            <span className="creation-date ms-3">
                              <i className="bi bi-calendar me-1"></i>
                              {formatGroupDate(group.createdAt)}
                            </span>
                          </div>
                        </div>
                      }
                      badge={<Badge bg="success" pill>참여중</Badge>}
                      className="hover-lift my-group-item"
                    />
                  ))}
                </div>
              </>
            )}
            
            <h3 className="mb-3">모든 스터디 그룹</h3>
            
            {/* 검색 및 필터 */}
            <DashboardCard 
              title="그룹 검색 및 필터"
              icon="bi-search"
              headerAction={
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={refreshData}
                  disabled={isLoading}
                  className="refresh-btn"
                >
                  <i className={`bi bi-arrow-clockwise ${isLoading ? 'spin' : ''}`}></i>
                </Button>
              }
              className={`mb-4 ${isFilterAnimating ? 'filter-animating' : ''}`}
            >
              <Row>
                <Col md={6} className="mb-3">
                  <InputGroup>
                    <FormControl
                      placeholder="그룹 검색..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className={`search-input ${isSearching ? 'searching' : ''}`}
                    />
                    {isSearching && (
                      <InputGroup.Text>
                        <i className="bi bi-search spinning"></i>
                      </InputGroup.Text>
                    )}
                  </InputGroup>
                </Col>
                
                <Col md={6} className="mb-3">
                  <InputGroup>
                    <InputGroup.Text>주제</InputGroup.Text>
                    <FormControl
                      as="select"
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
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
            </DashboardCard>
            
            {/* 그룹 목록 */}
            {displayGroups.length > 0 ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {displayGroups.map(group => (
                  <Col key={group.id}>
                    <div className="group-card-wrapper hover-lift">
                      <GroupCard 
                        group={group} 
                        isMember={false} // 이미 필터링했으므로 항상 false
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center my-5">
                <i className="bi bi-search" style={{ fontSize: "3rem", color: "var(--text-muted)" }}></i>
                <p className="mt-3 text-muted">
                  {isSearching ? "검색 중..." : "검색 조건에 맞는 그룹이 없습니다."}
                </p>
                {(searchTerm || selectedSubject || selectedTags.length > 0) && !isSearching && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSubject("");
                      setSelectedTags([]);
                    }}
                    className="mt-2"
                  >
                    필터 초기화
                  </Button>
                )}
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