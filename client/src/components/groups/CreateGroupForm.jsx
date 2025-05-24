import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Form, Button, Card, Alert, Row, Col, 
  InputGroup, Badge, FormSelect 
} from 'react-bootstrap';
import { GROUP_SUBJECTS, GROUP_TAGS, MEETING_TYPES } from '../../utils/GroupConstants';
import { createGroup } from '../../utils/GroupService';
import useLoading from '../../hooks/useLoading';
import LoadingSpinner from '../../components/LoadingSpinner';

const CreateGroupForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, startSubmitting] = useLoading();
  
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
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  
  // 선택된 주제에 따라 사용 가능한 태그 업데이트
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
    setSelectedSubject(value);
    
    // 현재 선택된 주제를 formData에 추가
    if (value && !formData.subject.includes(value)) {
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
      subject: formData.subject.filter(subject => subject !== subjectToRemove)
    });
    
    // 제거된 주제와 관련된 태그도 함께 제거
    setFormData({
      ...formData,
      subject: formData.subject.filter(subject => subject !== subjectToRemove),
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
  
  // 키 입력 핸들러 (엔터 키로 태그 추가)
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };
  
  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 폼 검증
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
      
      // 그룹 생성
      await startSubmitting(createGroup(formData, currentUser.uid));
      
      // 그룹 목록 페이지로 이동
      navigate('/groups');
    } catch (error) {
      console.error('Error creating group:', error);
      setError('그룹 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };
  
  return (
    <div className="page-container">
      {/* 네비게이션바 높이만큼 추가하는 여백 */}
      <div className="navbar-spacer"></div>
    
      <div className="create-group-container">
        {isSubmitting && <LoadingSpinner />}
        
        <Card className="shadow-sm create-group-card">
          <Card.Body>
            <h2 className="text-center mb-4">새 스터디 그룹 만들기</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>그룹 이름</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="그룹 이름을 입력하세요"
                  required
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
                  placeholder="그룹에 대한 설명을 입력하세요"
                  required
                />
              </Form.Group>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>주제 선택</Form.Label>
                    <FormSelect
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
                    </FormSelect>
                  </Form.Group>
                  
                  <div className="mt-2 selected-subjects">
                    {formData.subject.map((subject) => (
                      <Badge 
                        bg="primary" 
                        className="me-1 mb-1 p-2 subject-badge" 
                        key={subject}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveSubject(subject)}
                      >
                        {subject} &times;
                      </Badge>
                    ))}
                  </div>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>최대 인원수</Form.Label>
                    <FormSelect
                      name="maxMembers"
                      value={formData.maxMembers}
                      onChange={handleChange}
                    >
                      {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((num) => (
                        <option key={num} value={num}>
                          {num}명
                        </option>
                      ))}
                    </FormSelect>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>미팅 방식</Form.Label>
                <div className="meeting-types">
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
                      className="meeting-type-radio"
                    />
                  ))}
                </div>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>태그 추가</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="태그를 입력하거나 아래에서 선택하세요"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                  />
                  <Button variant="outline-secondary" onClick={handleAddCustomTag}>
                    추가
                  </Button>
                </InputGroup>
                
                <div className="mt-2 mb-3 available-tags">
                  {availableTags.map((tag) => (
                    <Badge 
                      bg="secondary" 
                      className={`me-1 mb-1 p-2 tag-badge ${formData.tags.includes(tag) ? 'opacity-50' : ''}`}
                      key={tag}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="selected-tags">
                  <p className="mb-1">선택된 태그:</p>
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag) => (
                      <Badge 
                        bg="success" 
                        className="me-1 mb-1 p-2 tag-badge" 
                        key={tag}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} &times;
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted">태그가 선택되지 않았습니다.</p>
                  )}
                </div>
              </Form.Group>
              
              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 mt-3 create-group-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? '그룹 생성 중...' : '그룹 생성하기'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default CreateGroupForm;