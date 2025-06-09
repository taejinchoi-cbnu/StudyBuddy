import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { getAllGroups, getUserGroups } from "../utils/GroupService";
import { GROUP_SUBJECTS, GROUP_TAGS, ALL_TAGS } from "../utils/GroupConstants";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import LoadingSpinner from "../components/LoadingSpinner";
import useFirebaseData from "../hooks/useFirebaseData";
import UniversalCard from "../components/common/UniversalCard";
import ListItem from "../components/common/ListItem";
import logoQuestion from "../assets/logoQuestion.png";

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

  // 페이지네이션 상태
  const [displayedGroups, setDisplayedGroups] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 모든 그룹 데이터 가져오기
  const fetchAllGroups = useCallback(() => {
    return getAllGroups();
  }, []);

  // 사용자 그룹 데이터 가져오기
  const fetchUserGroups = useCallback(() => {
    if (!currentUser) return Promise.resolve([]);
    return getUserGroups(currentUser.uid);
  }, [currentUser]);

  // useFirebaseData로 모든 그룹 데이터 관리
  const {
    data: groups,
    loading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups
  } = useFirebaseData(
    fetchAllGroups,
    [],
    {
      enabled: true,
      initialData: [],
      onSuccess: (groupsData) => {
        console.log("모든 그룹 데이터 로드 성공:", groupsData?.length || 0, "개 그룹");
        
        // 초기 그룹 데이터를 displayedGroups에 설정
        if (groupsData && Array.isArray(groupsData)) {
          setDisplayedGroups(groupsData);
        }
      },
      onError: (error) => {
        console.error("모든 그룹 데이터 로드 실패:", error);
      }
    }
  );

  // useFirebaseData로 사용자 그룹 데이터 관리
  const {
    data: userGroups,
    loading: userGroupsLoading,
    error: userGroupsError,
    refetch: refetchUserGroups
  } = useFirebaseData(
    fetchUserGroups,
    [currentUser],
    {
      enabled: !!currentUser,
      initialData: [],
      onSuccess: (userGroupsData) => {
        console.log("사용자 그룹 데이터 로드 성공:", userGroupsData?.length || 0, "개 그룹");
      },
      onError: (error) => {
        console.error("사용자 그룹 데이터 로드 실패:", error);
      }
    }
  );

  // 데이터 새로고침 함수
  const refreshData = useCallback(async () => {
    try {
      console.log("그룹 데이터 새로고침 시작");
      setDisplayedGroups([]);
      
      await refetchGroups();
      await refetchUserGroups();
    } catch (error) {
      console.error("그룹 데이터 새로고침 실패:", error);
    }
  }, [refetchGroups, refetchUserGroups]);

  // 더 많은 그룹 로드 함수 (기본적인 페이지네이션)
  const loadMoreGroups = useCallback(async () => {
    if (isLoadingMore || !groups || displayedGroups.length >= groups.length) {
      return;
    }

    setIsLoadingMore(true);
    
    try {
      // 시뮬레이션을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 현재 표시된 그룹 수를 기준으로 다음 10개 그룹 추가
      const nextBatch = groups.slice(displayedGroups.length, displayedGroups.length + 10);
      
      if (nextBatch.length > 0) {
        setDisplayedGroups(prevGroups => [...prevGroups, ...nextBatch]);
        console.log("더보기 완료, 총 그룹 수:", displayedGroups.length + nextBatch.length);
      }
    } catch (error) {
      console.error("더보기 로드 오류:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, groups, displayedGroups.length]);

  // 검색어에 따른 필터링 함수
  const filteredGroups = useCallback(() => {
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

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setIsFilterAnimating(true);
  }, []);

  // 주제 변경 핸들러
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

  // 태그 선택/해제 토글
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

  // 필터링된 그룹 데이터
  const displayGroups = isFilterAnimating ? searchResults : (searchResults.length > 0 ? searchResults : filteredGroups());

  // 더보기 버튼 표시 여부
  const hasMore = groups && displayedGroups.length < groups.length;

  // 그룹 카드 렌더링 함수
// 그룹 카드 렌더링 함수 - 완전히 새로 작성
const renderGroupCard = (group, isMember) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "최근 생성됨";
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return "최근 생성됨";
    }
    
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric"
    });
  };

  return (
    <UniversalCard
      variant="group"
      onClick={() => handleGroupClick(group.id)}
      className="group-card-item"
    >
      {/* 카드 헤더 */}
      <div className="group-card-header">
        <div className="group-title-section">
          <h5 className="group-title">{group.name || "제목 없음"}</h5>
          {isMember && <Badge bg="success" className="member-badge">참여중</Badge>}
        </div>
        <div className="group-meta-line">
          <span className="member-count">
            <i className="bi bi-people-fill me-1"></i>
            {group.memberCount || 1}/{group.maxMembers}
          </span>
          <span className="meeting-type">
            <i className="bi bi-geo-alt-fill me-1"></i>
            {group.meetingType}
          </span>
        </div>
      </div>

      {/* 카드 바디 */}
      <div className="group-card-body">
        <p className="group-description">
          {group.description 
            ? (group.description.length > 85
                ? `${group.description.substring(0, 85)}...`
                : group.description)
            : "설명이 없습니다."}
        </p>

        {/* 태그 섹션 */}
        <div className="group-tags-section">
          {group.tags && Array.isArray(group.tags) && group.tags.length > 0 ? (
            <div className="group-tags-list">
              {group.tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  bg="light" 
                  text="dark"
                  className="group-tag-item"
                >
                  {tag}
                </Badge>
              ))}
              {group.tags.length > 3 && (
                <Badge bg="secondary" className="group-tag-more">
                  +{group.tags.length - 3}
                </Badge>
              )}
            </div>
          ) : (
            <div className="no-tags">
              <Badge bg="outline-secondary" className="no-tags-badge">
                태그 없음
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* 카드 푸터 */}
      <div className="group-card-footer">
        <small className="creation-date">
          <i className="bi bi-calendar3 me-1"></i>
          {formatDate(group.createdAt)}
        </small>
        <div className="group-status">
          {group.memberCount >= group.maxMembers ? (
            <Badge bg="danger" className="status-badge">모집완료</Badge>
          ) : (
            <Badge bg="primary" className="status-badge">모집중</Badge>
          )}
        </div>
      </div>
    </UniversalCard>
  );
};

  return (
    <div className={`page-container ${darkMode ? "dark-mode" : ""}`}>
      {/* 네비게이션바 */}
      <Container className={`mt-4 ${darkMode ? "dark-mode" : ""}`}>
        {/* 로딩 상태 */}
        {isLoading ? (
          <div className="text-center py-5">
            <LoadingSpinner />
            <p className="mt-3">그룹 정보를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* 에러 메시지 표시 */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* 내 스터디 그룹 섹션 */}
            {currentUser && userGroups && userGroups.length > 0 && (
              <>
                <h3 className="mb-4" style={{marginTop: "2rem", fontSize: "2.2rem"}}>참가중인 그룹</h3>
                <div className="my-groups-list mb-2">
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
            <div className="d-flex justify-content-between align-items-center mb-1 groups-header-section">
            <h3 style={{fontSize: "2.2rem"}}>모든 스터디 그룹</h3>
              <Button
                variant="primary"
                onClick={() => navigate("/groups/create")}
                className="create-group-btn"
              >
                새 그룹 만들기
              </Button>
            </div>

            {/* 검색 및 필터 */}
            <UniversalCard
              variant="dashboard"
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
                </Button>
              }
              className={`mb-4 search-filter-card ${isFilterAnimating ? 'filter-animating' : ''}`}
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
                      style={{boxShadow: "none"}}
                    >
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
                    : ALL_TAGS && ALL_TAGS.map(tag => (
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
            </UniversalCard>

            {/* 그룹 목록 */}
            {displayGroups.length > 0 ? (
              <Row xs={1} md={2} lg={3} className="g-4">
                {displayGroups.map(group => (
                  <Col key={group.id}>
                    <div className="group-card-wrapper hover-lift">
                      {renderGroupCard(group, false)}
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center my-5">
                <img src={logoQuestion} style={{ width: "3rem", height: "3rem" }}/>
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
                  <LoadingSpinner />
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