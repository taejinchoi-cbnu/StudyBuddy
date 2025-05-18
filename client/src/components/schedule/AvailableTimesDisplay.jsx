import { Table, Alert } from 'react-bootstrap';

const AvailableTimesDisplay = ({ availableTimeSlots }) => {
  // 가능한 시간이 없는 경우
  if (!availableTimeSlots || availableTimeSlots.length === 0) {
    return (
      <Alert variant="warning">
        모두가 가능한 시간이 없습니다. 불가능한 시간을 다시 조정해보세요.
      </Alert>
    );
  }

  // 가능한 시간이 있는 요일만 필터링
  const daysWithAvailableTimes = availableTimeSlots.filter(
    dayData => dayData.availableBlocks && dayData.availableBlocks.length > 0
  );

  // 가능한 시간이 없는 경우
  if (daysWithAvailableTimes.length === 0) {
    return (
      <Alert variant="warning">
        모두가 가능한 시간이 없습니다. 불가능한 시간을 다시 조정해보세요.
      </Alert>
    );
  }

  return (
    <div>
      <p className="text-muted mb-3">
        아래는 모든 멤버가 참여 가능한 시간입니다. 최소 1시간 이상 가능한 시간만 표시됩니다.
      </p>
      
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>요일</th>
            <th>가능한 시간대</th>
          </tr>
        </thead>
        <tbody>
          {daysWithAvailableTimes.map((dayData, index) => (
            <tr key={index}>
              <td width="20%"><strong>{dayData.day}</strong></td>
              <td>
                {dayData.availableBlocks.map((block, blockIndex) => (
                  <div key={blockIndex} className="mb-1">
                    <span className="badge bg-success me-2">
                      {block.start} - {block.end}
                    </span>
                    <small className="text-muted">
                      ({calculateDuration(block.start, block.end)})
                    </small>
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <div className="mt-3">
        <small className="text-muted">
          tip: 위 결과를 그룹 채팅방에 공유하여 최종 일정을 결정하세요.
        </small>
      </div>
    </div>
  );
};

// 시간 간격 계산 함수
function calculateDuration(start, end) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  
  // 시간과 분으로 표시
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}분`;
  } else if (minutes === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${minutes}분`;
  }
}

export default AvailableTimesDisplay;