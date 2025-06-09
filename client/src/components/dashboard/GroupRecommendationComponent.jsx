import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { getAllGroups } from "../../utils/GroupService";
import ListItem from "../common/ListItem";
import logoQuestion from "../../assets/logoQuestion.png";


const GroupRecommendationComponent = ({ userGroups = [] }) => {
  const { currentUser, userProfile } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [recommendedGroups, setRecommendedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 추천 그룹 계산
  const calculateRecommendations = useCallback(async () => {
    if (!currentUser || !userProfile) return;
    
    try {
      setLoading(true);
      const allGroups = await getAllGroups();
      
      // 사용자가 참여하지 않은 그룹들 필터링
      const joinedGroupIds = userGroups.map(group => group.id);
      const availableGroups = allGroups.filter(group => 
        !joinedGroupIds.includes(group.id)
      );
      
      // 사용자 관심사와 매칭되는 그룹들 찾기
      const userInterests = userProfile.interests || [];
      const matchedGroups = availableGroups.filter(group => {
        if (!group.tags || !Array.isArray(group.tags)) return false;
        
        // 공통 태그가 있는 그룹 찾기
        return group.tags.some(tag => userInterests.includes(tag));
      });
      
      // 상위 3개만 선택
      setRecommendedGroups(matchedGroups.slice(0, 3));
    } catch (error) {
      console.error("추천 그룹 로드 오류:", error);
      setError("추천 그룹을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, userProfile, userGroups]);

  useEffect(() => {
    calculateRecommendations();
  }, [calculateRecommendations]);

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" />
        <p className="mt-2 mb-0 small">추천 그룹 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="warning" className="mb-0 small">{error}</Alert>;
  }

  return (
    <div className={`group-recommendation-component ${darkMode ? "dark-mode" : ""}`} style={{textAlign: "center", maxHeight: "270px", overflowY: "auto", padding: "0.3rem"}}>
      {recommendedGroups.length > 0 ? (
        <div className="scroll-container">
          {recommendedGroups.map((group) => (
            <ListItem
              key={group.id}
              variant="recommendation"
              onClick={() => handleGroupClick(group.id)}
              title={group.name}
              subtitle={
                <>
                  <p className="mb-1">
                    {group.description?.length > 60 
                      ? `${group.description.substring(0, 60)}...` 
                      : group.description}
                  </p>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {group.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} bg="secondary" className="badge-count-small">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <small className="text-muted">
                    {group.memberCount || 1}/{group.maxMembers}명
                  </small>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-common">
          <img src={logoQuestion} style={{width: "3rem", height: "3rem", marginTop: "5rem"}} />
          <p>관심사와 맞는 그룹을 찾지 못했습니다.</p>
        </div>
      )}
    </div>
  );
};

export default GroupRecommendationComponent;