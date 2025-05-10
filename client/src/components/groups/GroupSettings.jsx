import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { updateGroup } from '../../utils/GroupService';
import { GROUP_SUBJECTS, GROUP_TAGS, MEETING_TYPES } from '../../utils/GroupConstants';
import useLoading from '../../hooks/UseLoading';
import DeleteGroupModal from './DeleteGroupModal';

const GroupSettings = ({ group, currentUser, onUpdateSuccess, onDeleteSuccess }) => {
  const { darkMode } = useDarkMode();
  const [isUpdating, startUpdating] = useLoading();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
  
  // 선택된 주제에 따라 가용 태그 업데이트
  useEffect(() => {
    if (selectedSubject && GROUP_TAGS[selectedSubject]) {
      setAvailableTags(GROUP_TAGS[selectedSubject]);
    } else {
      setAvailableTags([]);
    }
  }, [selectedSubject]);
  
  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 주제 선택 핸들러
  const handleSubjectSelect = (e) => {
    const value = e.target.value;
    if (!value) return;
    
    setSelectedSubject(value);
    
    // 이미 선택된 주제가 아닌 경우에만 추가
    if (!formData.subject.includes(value)) {
      setFormData({
        ...formData,
        subject: [...formData.subject, value]
      });
    }
  };
  
  // 주제 제거 핸들러
  const handleRemoveSubject = (subjectToRemove) => {
    setFormData({
      ...formData,
      subject: formData.subject.filter(subject => subject !== subjectToRemove),
      // 제거된 주제와 관련된 태그도 함께 제거
      tags: formData.tags.filter(tag => !GROUP_TAGS[subjectToRemove]?.includes(tag))
    });
  };
  
  // 태그 선택 핸들러
  const handleTagSelect = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
    }
    setTagInput('');
  };
  
  // 태그 제거 핸들러
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // 커스텀 태그 추가 핸들러
  const handleAddCustomTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };
  
  // 키 입력 핸들러
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!formData.name.trim()) {
      return setError('그룹 이름을 입력해주세요.');
    }
    
    if (!formData.description.trim()) {
      return setError('그룹 설명을 입력해주세요.');
    }
    
    if (formData.subject.length === 0) {
      return setError('최소 하나의 주제를 선택해주세요.');
    }
    
    try {
      setError('');
      setSuccess('');
      
      // 그룹 업데이트
      await startUpdating(updateGroup(group.id, formData, currentUser.uid));
      
      setSuccess('그룹 정보가 성공적으로 업데이트되었습니다.');
      onUpdateSuccess();
    } catch (error) {
      console.error('Error updating group:', error);
      setError('그룹 정보 업데이트 중 오류가 발생했습니다: ' + error.message);
    }
  };
  
  // 그룹 삭제 모달 토글
  const toggleDeleteModal = () => setShowDeleteModal(!showDeleteModal);
  
  return (
    <Card className={`shadow-sm ${darkMode ? 'dark-mode' : ''}`}>
      <Card.Body>
        <h3 className="mb-4">그룹 설정</h3>
        
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>그룹 이름</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
              onChange={handleChange}
              placeholder="그룹에 대한 설명"
            />
          </Form.Group>
          
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>주제 선택</Form.Label>
                <Form.Select
                  name="subject"
                  value={selectedSubject}
                  onChange={handleSubjectSelect}
                >
                  <option value="">주제를 선택하세요</option>
                  {GROUP_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              
              <div className="mt-2 mb-3">
                {formData.subject.map((subject) => (
                  <Badge 
                    bg="primary" 
                    className="me-1 mb-1 p-2" 
                    key={subject}
                    onClick={() => handleRemoveSubject(subject)}
                    style={{ cursor: 'pointer' }}
                  >
                    {subject} &times;
                  </Badge>
                ))}
              </div>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label>최대 인원수</Form.Label>
                <Form.Select
                  name="maxMembers"
                  value={formData.maxMembers}
                  onChange={handleChange}
                >
                  {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((num) => (
                    <option key={num} value={num}>
                      {num}명
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>미팅 방식</Form.Label>
            <div>
              {MEETING_TYPES.map((type) => (
                <Form.Check
                  key={type}
                  inline
                  type="radio"
                  label={type}
                  name="meetingType"
                  value={type}
                  checked={formData.meetingType === type}
                  onChange={handleChange}
                />
              ))}
            </div>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>태그</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                placeholder="태그 입력 후 엔터"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="me-2"
              />
              <Button variant="outline-secondary" onClick={handleAddCustomTag}>
                추가
              </Button>
            </div>
            
            <div className="mt-2">
              <p className="mb-1">추천 태그:</p>
              <div>
                {availableTags.map((tag) => (
                  <Badge 
                    bg="secondary" 
                    className={`me-1 mb-1 ${formData.tags.includes(tag) ? 'opacity-50' : ''}`}
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    style={{ cursor: 'pointer' }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="mt-3">
              <p className="mb-1">선택된 태그:</p>
              <div>
                {formData.tags.length > 0 ? (
                  formData.tags.map((tag) => (
                    <Badge 
                      bg="success" 
                      className="me-1 mb-1 p-2" 
                      key={tag}
                      onClick={() => handleRemoveTag(tag)}
                      style={{ cursor: 'pointer' }}
                    >
                      {tag} &times;
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted">태그가 선택되지 않았습니다.</p>
                )}
              </div>
            </div>
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
        
        <div className="danger-zone">
          <h4 className="text-danger mb-3">위험 영역</h4>
          <p className="text-muted mb-3">이 작업은 되돌릴 수 없으니 신중하게 선택하세요.</p>
          <Button 
            variant="outline-danger" 
            className="w-100"
            onClick={toggleDeleteModal}
          >
            그룹 삭제하기
          </Button>
        </div>
        
        {/* 그룹 삭제 모달 */}
        <DeleteGroupModal
          show={showDeleteModal}
          onHide={toggleDeleteModal}
          group={group}
          userId={currentUser.uid}
          onDeleteSuccess={onDeleteSuccess}
        />
      </Card.Body>
    </Card>
  );
};

export default GroupSettings;