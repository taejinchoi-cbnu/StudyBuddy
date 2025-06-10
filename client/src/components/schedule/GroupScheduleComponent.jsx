import { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Button, Alert, Table, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { getGroupById, saveGroupAppointment, deleteGroupAppointment, saveUserAvailability, getGroupAvailability } from '../../utils/GroupService';
import ScheduleManager from './ScheduleManager';
import useLoading from '../../hooks/useLoading';

// 요일 및 시간 데이터
const DAYS_OF_WEEK = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
const TIME_SLOTS = [];
for (let hour = 9; hour <= 21; hour++) {
  const formattedHour = hour.toString().padStart(2, '0');
  TIME_SLOTS.push(`${formattedHour}:00`);
}

const GroupScheduleComponent = ({ group, members, onGroupUpdate }) => {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();
  const [availabilityData, setAvailabilityData] = useState({});
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculationDone, setCalculationDone] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [isSaving, startSaving] = useLoading();
  const [showConfirmedSchedules, setShowConfirmedSchedules] = useState(true);
  
  // 사용자 권한 확인
  const [userStatus, setUserStatus] = useState({
    isMember: false,
    isAdmin: false
  });

  // 컴포넌트 마운트 시 초기화 및 권한 확인
  useEffect(() => {
    if (!currentUser || !members || !group) {
      console.log('초기화 조건 미충족:', { 
        hasCurrentUser: !!currentUser, 
        hasMembers: !!members, 
        hasGroup: !!group 
      });
      return;
    }
    
    console.log('멤버십 확인:', {
      currentUserId: currentUser.uid,
      members: members,
      groupId: group.id
    });
    
    // 멤버십 상태 확인
    const member = members.find(m => m.userId === currentUser.uid);
    const isMember = !!member;
    const isAdmin = member?.role === 'admin';
    
    console.log('멤버십 상태:', { isMember, isAdmin, member });
    
    setUserStatus({ isMember, isAdmin });
    
    // 그룹에 저장된 일정 가져오기
    if (group.appointments && Array.isArray(group.appointments)) {
      setAppointments(group.appointments);
    }
    
    // 저장된 가용성 데이터 로드
    const loadAvailabilityData = async () => {
      try {
        // 데이터베이스에서 가용성 데이터 가져오기
        const savedAvailability = await getGroupAvailability(group.id);
        
        // 초기 데이터 구조 생성
        const initialData = {};
        
        members.forEach(member => {
          const savedData = savedAvailability[member.userId];
          initialData[member.userId] = {
            name: member.displayName || '사용자',
            unavailableTimes: savedData?.unavailableTimes || []
          };
        });
        
        setAvailabilityData(initialData);
        console.log('가용성 데이터 로드 완료:', initialData);
      } catch (error) {
        console.error('가용성 데이터 로드 실패:', error);
        // 오류 시 기본 데이터 구조만 생성
        const initialData = {};
        members.forEach(member => {
          initialData[member.userId] = {
            name: member.displayName || '사용자',
            unavailableTimes: []
          };
        });
        setAvailabilityData(initialData);
      }
    };
    
    if (members.length > 0) {
      loadAvailabilityData();
    }
  }, [currentUser, members, group]);

  // 불가능한 시간 추가
  const addUnavailableTime = async (userId, day, startTime, endTime) => {
    // 시간 형식 검증
    if (!day || !startTime || !endTime || startTime >= endTime) {
      setError('유효한 시간 범위를 선택해주세요.');
      return false;
    }

    try {
      startSaving();

      const newTime = { day, start: startTime, end: endTime };
      
      setAvailabilityData(prevData => {
        // 기존 사용자 데이터가 없으면 초기화
        if (!prevData[userId]) {
          prevData[userId] = {
            name: members.find(m => m.userId === userId)?.displayName || '사용자',
            unavailableTimes: []
          };
        }

        // 중복 체크
        const isDuplicate = prevData[userId].unavailableTimes.some(
          time => time.day === day && time.start === startTime && time.end === endTime
        );

        if (isDuplicate) {
          setError('이미 추가된 시간입니다.');
          return prevData;
        }

        // 새 시간 추가
        const updatedData = {
          ...prevData,
          [userId]: {
            ...prevData[userId],
            unavailableTimes: [
              ...prevData[userId].unavailableTimes,
              newTime
            ]
          }
        };

        // 데이터베이스에 저장
        saveUserAvailability(group.id, userId, updatedData[userId])
          .then(() => {
            console.log('가용성 데이터 저장 성공');
          })
          .catch(error => {
            console.error('가용성 데이터 저장 실패:', error);
            setError('시간 저장 중 오류가 발생했습니다.');
          });

        return updatedData;
      });
      
      // 추가 성공
      setError('');
      setSuccess('불가능한 시간이 추가되었습니다.');
      return true;
    } catch (error) {
      console.error('시간 추가 실패:', error);
      setError('시간 추가 중 오류가 발생했습니다.');
      return false;
    } finally {
      // startSaving 완료를 비동기로 처리
      setTimeout(() => {
        if (typeof isSaving === 'function') {
          // useLoading 훅의 stop 함수 호출
        }
      }, 500);
    }
  };

  // 불가능한 시간 삭제
  const removeUnavailableTime = async (userId, index) => {
    try {
      startSaving();

      setAvailabilityData(prevData => {
        if (!prevData[userId] || !prevData[userId].unavailableTimes[index]) {
          return prevData;
        }

        const updatedTimes = [...prevData[userId].unavailableTimes];
        updatedTimes.splice(index, 1);

        const updatedData = {
          ...prevData,
          [userId]: {
            ...prevData[userId],
            unavailableTimes: updatedTimes
          }
        };

        // 데이터베이스에 저장
        saveUserAvailability(group.id, userId, updatedData[userId])
          .then(() => {
            console.log('가용성 데이터 삭제 저장 성공');
          })
          .catch(error => {
            console.error('가용성 데이터 삭제 저장 실패:', error);
            setError('시간 삭제 저장 중 오류가 발생했습니다.');
          });

        return updatedData;
      });
      
      setSuccess('시간이 삭제되었습니다.');
    } catch (error) {
      console.error('시간 삭제 실패:', error);
      setError('시간 삭제 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => {
        if (typeof isSaving === 'function') {
          // useLoading 훅의 stop 함수 호출
        }
      }, 500);
    }
  };

  // 가능한 시간 계산
  const calculateAvailableTimes = () => {
    try {
      // 결과를 저장할 배열 초기화
      const result = [];
      
      // 각 요일별로 계산
      DAYS_OF_WEEK.forEach(day => {
        // 전체 시간 슬롯
        const allTimeSlots = [];
        
        // 9시부터 21시까지 30분 단위로 시간 슬롯 생성
        for (let hour = 9; hour < 21; hour++) {
          const formattedHour = hour.toString().padStart(2, '0');
          allTimeSlots.push(`${formattedHour}:00`);
          allTimeSlots.push(`${formattedHour}:30`);
        }
        allTimeSlots.push('21:00');
        
        // 불가능한 시간 블록 계산
        const unavailableBlocks = [];
        
        Object.values(availabilityData).forEach(userData => {
          userData.unavailableTimes.forEach(time => {
            if (time.day === day) {
              // 시작과 끝 시간의 인덱스 찾기
              const startIndex = allTimeSlots.indexOf(time.start);
              const endIndex = allTimeSlots.indexOf(time.end);
              
              if (startIndex !== -1 && endIndex !== -1) {
                // 각 시간 슬롯을 불가능 블록에 추가
                for (let i = startIndex; i < endIndex; i++) {
                  unavailableBlocks.push(i);
                }
              }
            }
          });
        });
        
        // 가능한 시간 슬롯 계산
        const availableBlocks = [];
        let startBlock = null;
        
        for (let i = 0; i < allTimeSlots.length; i++) {
          if (!unavailableBlocks.includes(i)) {
            // 가능한 시간 블록의 시작
            if (startBlock === null) {
              startBlock = i;
            }
            
            // 마지막 블록이거나 다음 블록이 불가능할 경우 현재 블록까지 추가
            if (i === allTimeSlots.length - 1 || unavailableBlocks.includes(i + 1)) {
              if (startBlock !== null) {
                availableBlocks.push({
                  start: allTimeSlots[startBlock],
                  end: allTimeSlots[i + 1] || '21:30'
                });
                startBlock = null;
              }
            }
          } else {
            // 불가능한 블록, 이전 가능 블록이 있다면 종료
            if (startBlock !== null) {
              availableBlocks.push({
                start: allTimeSlots[startBlock],
                end: allTimeSlots[i]
              });
              startBlock = null;
            }
          }
        }
        
        // 최소 1시간 이상인 블록만 최종 결과에 추가
        if (availableBlocks.length > 0) {
          result.push({
            day,
            availableBlocks: availableBlocks.filter(block => {
              // 시작과 끝 시간을 분으로 변환하여 비교
              const startParts = block.start.split(':').map(Number);
              const endParts = block.end.split(':').map(Number);
              
              const startMinutes = startParts[0] * 60 + startParts[1];
              const endMinutes = endParts[0] * 60 + endParts[1];
              
              // 최소 60분(1시간) 이상인 블록만 반환
              return (endMinutes - startMinutes) >= 60;
            })
          });
        }
      });
      
      // 결과 저장
      setAvailableTimeSlots(result);
      setCalculationDone(true);
      setSuccess('가능한 시간이 계산되었습니다.');
      return result;
    } catch (error) {
      console.error('시간 계산 오류:', error);
      setError('시간 계산 중 오류가 발생했습니다.');
      return [];
    }
  };

  // 멤버별 제출 현황 계산
  const getMemberSubmissionStatus = () => {
    if (!members || !availabilityData) return [];
    
    return members.map(member => {
      const hasSubmitted = availabilityData[member.userId] && 
                           availabilityData[member.userId].unavailableTimes && 
                           availabilityData[member.userId].unavailableTimes.length > 0;
      
      return {
        ...member,
        hasSubmitted
      };
    });
  };

  // 전체 제출 현황 퍼센트 계산
  const getSubmissionPercentage = () => {
    const status = getMemberSubmissionStatus();
    const submittedCount = status.filter(member => member.hasSubmitted).length;
    return Math.round((submittedCount / status.length) * 100) || 0;
  };

  // 모든 멤버가 제출했는지 확인
  const allMembersSubmitted = () => {
    return getSubmissionPercentage() === 100;
  };
  
  // 일정 처리 핸들러
  const handleAppointment = async (appointmentData, action = 'add') => {
    if (!group || !group.id) {
      setError('그룹 정보가 없습니다.');
      return;
    }

    if (!currentUser) {
      setError('사용자 정보가 없습니다.');
      return;
    }

    try {
      startSaving();
      
      if (action === 'delete') {
        // 일정 삭제 - userId 파라미터 추가
        await deleteGroupAppointment(group.id, appointmentData.id, currentUser.uid);
        setAppointments(prev => prev.filter(app => app.id !== appointmentData.id));
        setSuccess('일정이 삭제되었습니다.');
      } else {
        // 일정 추가 - userId 파라미터 추가
        const savedAppointment = await saveGroupAppointment(group.id, appointmentData, currentUser.uid);
        setAppointments(prev => [...prev, savedAppointment]);
        setSuccess('일정이 저장되었습니다.');
      }
      
      // 부모 컴포넌트에 업데이트 알림
      if (onGroupUpdate) {
        setTimeout(() => {
          onGroupUpdate();
        }, 500);
      }
      
    } catch (error) {
      console.error('일정 처리 오류:', error);
      if (action === 'delete') {
        setError('일정 삭제 중 오류가 발생했습니다: ' + error.message);
      } else {
        setError('일정 저장 중 오류가 발생했습니다: ' + error.message);
      }
    } finally {
      setTimeout(() => {
        if (typeof isSaving === 'function') {
          // useLoading 훅의 stop 함수 호출
        }
      }, 500);
    }
  };

  // 그룹 멤버가 아닌 경우 접근 제한
  if (!userStatus.isMember) {
    return (
      <div className={`schedule-component access-denied ${darkMode ? 'dark-mode' : ''}`}>
        <div className="schedule-component-body text-center py-5">
          <h4 className="mb-3">접근 권한이 없습니다</h4>
          <p>이 기능은 그룹 멤버만 사용할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`schedule-component ${darkMode ? 'dark-mode' : ''}`}>
      <div className="schedule-component-body">
        <h3 className="schedule-component-title mb-3">그룹 스케줄 조정</h3>
        
        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        
        <div className="mb-3">
          <p>
            모든 그룹 멤버들의 가능한 시간을 찾아드립니다.</p> <br/>
            <p>먼저 각자 참여할 수 <strong>없는</strong> 시간을 입력해주세요.
          </p>
        </div>
        
        {/* 확정된 일정 섹션 */}
        {appointments.length > 0 && (
          <div className="schedule-section confirmed-schedules-section mb-4">
            <div className="schedule-section-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="section-title mb-0">확정된 그룹 일정</h4>
                <button 
                  className="btn-schedule-action btn-link"
                  onClick={() => setShowConfirmedSchedules(!showConfirmedSchedules)}
                >
                  {showConfirmedSchedules ? '숨기기' : '보이기'}
                </button>
              </div>
            </div>
            {showConfirmedSchedules && (
              <div className="schedule-section-body">
                {appointments.map((appointment, idx) => (
                  <Alert key={idx} variant="success" className="mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="mb-1">{appointment.title}</h5>
                        <p className="mb-0">
                          <strong>일시:</strong> {appointment.day}, {appointment.start} - {appointment.end}
                        </p>
                        <small className="text-muted">
                          {appointment.createdAt ? `등록일: ${new Date(appointment.createdAt).toLocaleDateString()}` : ''}
                        </small>
                      </div>
                      {userStatus.isAdmin && (
                        <button 
                          className="btn-schedule-action btn-outline-danger"
                          onClick={() => handleAppointment(appointment, 'delete')}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* 진행 상황 표시 - 관리자만 볼 수 있음 */}
        {userStatus.isAdmin && (
          <div className="schedule-section submission-status-section mb-4">
            <div className="schedule-section-body">
              <h4 className="section-title mb-3">멤버 제출 현황</h4>
              <div className="mb-3">
                <ProgressBar 
                  now={getSubmissionPercentage()} 
                  label={`${getSubmissionPercentage()}%`}
                  variant={allMembersSubmitted() ? "success" : "info"}
                />
              </div>
              
              <Table hover responsive className="mt-3">
                <thead>
                  <tr>
                    <th>멤버</th>
                    <th>역할</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {getMemberSubmissionStatus().map((member, index) => (
                    <tr key={index}>
                      <td>{member.displayName || '사용자'}</td>
                      <td>
                        {member.role === 'admin' ? (
                          <span className="badge bg-danger">관리자</span>
                        ) : (
                          <span className="badge bg-info">멤버</span>
                        )}
                      </td>
                      <td>
                        {member.hasSubmitted ? (
                          <span className="badge bg-success">제출 완료</span>
                        ) : (
                          <span className="badge bg-warning text-dark">미제출</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        )}
        
        {/* 내 불가능한 시간 입력 섹션 */}
        <div className="schedule-section availability-input-section mb-4">
          <div className="schedule-section-body">
            <h4 className="section-title mb-3">내 불가능한 시간 설정</h4>
            {currentUser && (
              <ScheduleManager
                currentUser={currentUser}
                isAdmin={userStatus.isAdmin}
                userId={currentUser.uid}
                days={DAYS_OF_WEEK}
                timeSlots={TIME_SLOTS}
                onAdd={addUnavailableTime}
                existingTimes={availabilityData[currentUser.uid]?.unavailableTimes || []}
                onRemove={(index) => removeUnavailableTime(currentUser.uid, index)}
                availableTimeSlots={availableTimeSlots}
                onSelectAppointment={handleAppointment}
                existingAppointments={appointments}
                mode={calculationDone ? "full" : "availability-only"}
                showSteps={true}
                isLoading={isSaving}
              />
            )}
          </div>
        </div>
        
        {/* 시간 계산 버튼 - 관리자만 사용 가능 */}
        {userStatus.isAdmin && !calculationDone && (
          <div className="d-grid gap-2 mb-4">
            <button
              className="action-btn-primary"
              onClick={calculateAvailableTimes}
              disabled={!allMembersSubmitted() || isSaving}
            >
              {!allMembersSubmitted() 
                ? '모든 멤버가 시간을 입력해야 계산할 수 있습니다' 
                : isSaving ? '계산 중...' : '가능한 시간 계산하기'}
            </button>
            {!allMembersSubmitted() && (
              <small className="text-muted text-center mt-1">
                아직 미제출한 멤버가 있습니다. 모든 멤버가 입력 완료해야 계산이 가능합니다.
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupScheduleComponent;