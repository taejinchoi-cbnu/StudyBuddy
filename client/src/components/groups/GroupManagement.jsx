import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Badge, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { updateGroup, removeMember } from '../../utils/GroupService';
import { GROUP_SUBJECTS, GROUP_TAGS, MEETING_TYPES } from '../../utils/GroupConstants';
import useLoading from '../../hooks/useLoading';
import useNotification from '../../hooks/useNotification';
import GroupActionModal from './GroupActionModal';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';

const GroupManagement = ({ group, members = [], currentUser, onUpdateSuccess, onDeleteSuccess, onMemberRemoved }) => {
  const { darkMode } = useDarkMode();
  const [isUpdating, startUpdating] = useLoading();
  const [memberProfiles, setMemberProfiles] = useState({});
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'delete'
  
  const { 
    error, 
    success, 
    showError, 
    showSuccess, 
    clearAll 
  } = useNotification();
  
  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: [],
    tags: [],
    maxMembers: 6,
    meetingType: '온라인'
  });
  
  // 태그 선택용 상태
  const [selectedSubject, setSelectedSubject] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // 그룹 데이터로 폼 초기화
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        subject: group.subject || [],
        tags: group.tags || [],
        maxMembers: group.maxMembers || 6,
        meetingType: group.meetingType || '온라인'
      });
    }
  }, [group]);

  // 사용자 프로필 정보 로드
  useEffect(() => {
    const loadProfiles = async () => {
      const profiles = {};
      if (!members || !Array.isArray(members)) return;
      
      for (const member of members) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', member.userId));
          if (userDoc.exists()) {
            profiles[member.userId] = userDoc.data();
          }
        } catch (error) {
          console.error(`Error loading profile for ${member.userId}:`, error);
        }
      }
      setMemberProfiles(profiles);
    };
    
    if (members && members.length > 0) {
      loadProfiles();
    }
  }, [members]);

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return showError('그룹 이름을 입력해주세요.');
    }
    
    if (!formData.description.trim()) {
      return showError('그룹 설명을 입력해주세요.');
    }
    
    if (formData.subject.length === 0) {
      return showError('최소 하나의 주제를 선택해주세요.');
    }
    
    try {
      clearAll();
      await startUpdating(updateGroup(group.id, formData, currentUser.uid));
      showSuccess('그룹 정보가 성공적으로 업데이트되었습니다.');
      onUpdateSuccess();
    } catch (error) {
      showError('그룹 정보 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 멤버 제거 핸들러
  const handleRemoveMember = async (memberUserId) => {
    try {
      clearAll();
      await removeMember(group.id, memberUserId, currentUser.uid);
      showSuccess(`멤버가 그룹에서 제거되었습니다.`);
      onMemberRemoved(memberUserId);
    } catch (error) {
      showError('회원 제거 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 그룹 삭제 모달 열기
  const handleDeleteClick = () => {
    setModalType('delete');
    setShowActionModal(true);
  };

  return (
    <>
      <Card className={`shadow-sm ${darkMode ? 'dark-mode' : ''}`}>
        <Card.Body>
          <h3 className="mb-4">그룹 관리</h3>
          
          {error && <Alert variant="danger" onClose={clearAll} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={clearAll} dismissible>{success}</Alert>}
          
          <Tabs defaultActiveKey="settings" className="mb-4">
            {/* 그룹 설정 탭 */}
            <Tab eventKey="settings" title="그룹 설정">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>그룹 이름</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="그룹 이름"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>그룹 설명</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="그룹에 대한 설명을 입력하세요"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>주제 선택</Form.Label>
                  <Form.Select
                    value={selectedSubject}
                    onChange={(e) => {
                      const subject = e.target.value;
                      setSelectedSubject(subject);
                      if (subject && !formData.subject.includes(subject)) {
                        setFormData({
                          ...formData,
                          subject: [...formData.subject, subject]
                        });
                        setAvailableTags(GROUP_TAGS[subject] || []);
                      }
                    }}
                  >
                    <option value="">주제 선택</option>
                    {Array.isArray(GROUP_SUBJECTS) && GROUP_SUBJECTS.map((subject) => (
                      <option 
                        key={subject} 
                        value={subject}
                        disabled={formData.subject.includes(subject)}
                      >
                        {subject}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                {formData.subject.length > 0 && (
                  <div className="mb-3">
                    <Form.Label>선택된 주제</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                      {formData.subject.map((subject) => (
                        <Badge 
                          key={subject} 
                          bg="primary" 
                          className="d-flex align-items-center"
                        >
                          {subject}
                          <Button
                            variant="link"
                            className="text-white p-0 ms-2"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                subject: formData.subject.filter(s => s !== subject),
                                tags: formData.tags.filter(tag => !GROUP_TAGS[subject].includes(tag))
                              });
                            }}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label>태그</Form.Label>
                  <div className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="태그 입력"
                      list="available-tags"
                    />
                    <datalist id="available-tags">
                      {availableTags.map((tag) => (
                        <option key={tag} value={tag} />
                      ))}
                    </datalist>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        if (tagInput && !formData.tags.includes(tagInput)) {
                          setFormData({
                            ...formData,
                            tags: [...formData.tags, tagInput]
                          });
                          setTagInput('');
                        }
                      }}
                    >
                      추가
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="d-flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          bg="secondary" 
                          className="d-flex align-items-center"
                        >
                          {tag}
                          <Button
                            variant="link"
                            className="text-white p-0 ms-2"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                tags: formData.tags.filter(t => t !== tag)
                              });
                            }}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>최대 멤버 수</Form.Label>
                  <Form.Control
                    type="number"
                    min="2"
                    max="20"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({
                      ...formData,
                      maxMembers: parseInt(e.target.value)
                    })}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>모임 유형</Form.Label>
                  <Form.Select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({
                      ...formData,
                      meetingType: e.target.value
                    })}
                  >
                    {Array.isArray(MEETING_TYPES) && MEETING_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mt-3" 
                  disabled={isUpdating}
                >
                  {isUpdating ? '업데이트 중...' : '그룹 정보 저장'}
                </Button>
              </Form>
              
              <hr className="my-4" />
              
              {/* 위험 영역 */}
              <div className="danger-zone">
                <h4 className="text-danger mb-3">위험 영역</h4>
                <p className="text-muted mb-3">이 작업은 되돌릴 수 없으니 신중하게 선택하세요.</p>
                <Button 
                  variant="outline-danger" 
                  className="w-100"
                  onClick={handleDeleteClick}
                >
                  그룹 삭제하기
                </Button>
              </div>
            </Tab>

            {/* 멤버 관리 탭 */}
            <Tab eventKey="members" title="멤버 관리">
              <ListGroup>
                {Array.isArray(members) && members.map((member) => {
                  const profile = memberProfiles[member.userId] || {};
                  const isCurrentUser = currentUser && member.userId === currentUser.uid;
                  
                  return (
                    <ListGroup.Item 
                      key={member.userId}
                      className={`d-flex justify-content-between align-items-center ${darkMode ? 'dark-mode' : ''}`}
                    >
                      <div>
                        <div className="d-flex align-items-center">
                          <strong>{profile.displayName || '사용자'}</strong>
                          {isCurrentUser && <span className="ms-2">(나)</span>}
                          <Badge 
                            bg={member.role === 'admin' ? 'danger' : 'info'} 
                            className="ms-2"
                          >
                            {member.role === 'admin' ? '관리자' : '멤버'}
                          </Badge>
                        </div>
                        
                        <small className="text-muted d-block">
                          {member.joinedAt ? new Date(member.joinedAt.seconds * 1000).toLocaleDateString() : '날짜 정보 없음'}에 가입
                        </small>
                        
                        {profile.department && (
                          <small className="text-muted d-block">{profile.department}</small>
                        )}
                      </div>
                      
                      <div>
                        {!isCurrentUser && member.role !== 'admin' && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            제거
                          </Button>
                        )}
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* 그룹 액션 모달 */}
      <GroupActionModal
        show={showActionModal}
        onHide={() => setShowActionModal(false)}
        type={modalType}
        group={group}
        userId={currentUser?.uid}
        onDeleteSuccess={onDeleteSuccess}
      />
    </>
  );
};

export default GroupManagement; 