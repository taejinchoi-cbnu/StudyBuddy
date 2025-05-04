import { useState } from 'react';
import { Container, Button, Alert, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { createGroup } from '../utils/GroupService';
import { GROUP_SUBJECTS, GROUP_TAGS } from '../utils/GroupConstants';
import useLoading from '../hooks/UseLoading';
import LoadingSpinner from '../components/LoadingSpinner';

const TestDataPage = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isCreating, startCreating] = useLoading();

  // 샘플 데이터
  const sampleGroups = [
    {
      name: "JavaScript 스터디 그룹",
      description: "JavaScript 기초부터 고급 기술까지 함께 공부하는 그룹입니다. 주 1회 온라인 미팅을 통해 프로젝트를 진행하고 코드 리뷰를 합니다.",
      subject: ["Programming"],
      tags: ["JavaScript", "Web Development", "Frontend"],
      maxMembers: 6,
      meetingType: "온라인"
    },
    {
      name: "React 개발자 모임",
      description: "React와 관련 라이브러리를 사용하여 프로젝트를 진행하는 개발자 모임입니다. 실무에서 사용하는 팁과 트릭을 공유합니다.",
      subject: ["Programming"],
      tags: ["React", "JavaScript", "Frontend", "Redux"],
      maxMembers: 8,
      meetingType: "혼합"
    },
    {
      name: "UI/UX 디자인 워크샵",
      description: "UI/UX 디자인 원칙과 최신 트렌드를 공부하는 그룹입니다. 피그마를 주로 사용하며 서로의 포트폴리오를 리뷰합니다.",
      subject: ["Design"],
      tags: ["UI/UX", "Figma", "Graphic Design", "Prototyping"],
      maxMembers: 5,
      meetingType: "오프라인"
    }
  ];

  // 단일 그룹 생성
  const handleCreateGroup = async (groupData) => {
    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    console.log("Creating group with data:", groupData);
    console.log("Current user:", currentUser);

    try {
      setError('');
      setMessage('');
      
      // createGroup 함수를 직접 호출
      const newGroup = await createGroup(groupData, currentUser.uid);
      console.log("Group created successfully:", newGroup);
      
      setMessage(`그룹이 성공적으로 생성되었습니다: ${newGroup.name}`);
    } catch (error) {
      console.error('Detailed error creating group:', error);
      console.error('Error stack:', error.stack);
      setError(`그룹 생성 실패: ${error.message}`);
    }
  };

  // 모든 샘플 그룹 생성
  const handleCreateAllGroups = async () => {
    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setError('');
      setMessage('');
      
      console.log("Creating all sample groups...");
      const results = [];
      
      for (const groupData of sampleGroups) {
        try {
          console.log(`Creating group: ${groupData.name}`);
          const newGroup = await createGroup(groupData, currentUser.uid);
          console.log(`Group created: ${newGroup.name}`);
          results.push(`성공: ${newGroup.name}`);
        } catch (groupError) {
          console.error(`Error creating group ${groupData.name}:`, groupError);
          results.push(`실패: ${groupData.name} - ${groupError.message}`);
        }
      }
      
      setMessage(`그룹 생성 결과:\n${results.join('\n')}`);
    } catch (error) {
      console.error('Error in bulk group creation:', error);
      setError(`그룹 일괄 생성 실패: ${error.message}`);
    }
  };

  return (
    <Container className="mt-5">
      <h1>테스트 데이터 생성</h1>
      {isCreating && <LoadingSpinner />}
      
      {message && (
        <Alert variant="success" className="mt-3 white-space-pre-wrap">
          {message}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      <div className="mt-4">
        <h2>샘플 그룹 생성</h2>
        <Button 
          variant="primary" 
          onClick={handleCreateAllGroups} 
          disabled={isCreating || !currentUser}
          className="me-2 mb-3"
        >
          모든 샘플 그룹 생성
        </Button>
        
        <p className="text-muted">또는 개별 그룹을 생성하세요:</p>
        
        {sampleGroups.map((group, index) => (
          <div key={index} className="border p-3 mb-3 rounded">
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <div className="mb-2">
              <strong>주제:</strong> {group.subject.join(', ')}
            </div>
            <div className="mb-2">
              <strong>태그:</strong> {group.tags.join(', ')}
            </div>
            <div className="mb-2">
              <strong>최대 인원:</strong> {group.maxMembers}명
            </div>
            <div className="mb-2">
              <strong>미팅 방식:</strong> {group.meetingType}
            </div>
            <Button 
              variant="outline-primary" 
              onClick={() => handleCreateGroup(group)}
              disabled={isCreating || !currentUser}
            >
              이 그룹 생성
            </Button>
          </div>
        ))}
      </div>
      
      {/* CSS 스타일 */}
      <style>{`
        .white-space-pre-wrap {
          white-space: pre-wrap;
        }
      `}</style>
    </Container>
  );
};

export default TestDataPage;