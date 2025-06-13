import { firestore } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit, //이름 충돌나서
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  increment,
  writeBatch,
} from 'firebase/firestore';

//그룹 컬렉션들 나중에 정리
const groupsCollection = collection(firestore, 'groups');
const groupMembersCollection = collection(firestore, 'groupMembers');
const availabilityCollection = collection(firestore, 'groupAvailability');

//그룹 약속 저장하는거
export const saveGroupAppointment = async (
  groupId,
  appointmentData,
  userId,
) => {
  try {
    //먼저 관리자인지 확인 이거 필수임
    const memberDocRef = doc(groupMembersCollection, `${groupId}_${userId}`);
    const adminCheck = await getDoc(memberDocRef);
    const adminExists = adminCheck.exists();
    if (!adminExists) {
      throw new Error('Not admin');
    }
    const adminData = adminCheck.data();
    const isAdmin = adminData.role === 'admin';
    if (!isAdmin) {
      throw new Error('Not admin');
    }

    //약속 데이터에 메타데이터 추가
    const currentTime = new Date();
    const timeString = currentTime.toISOString();
    const newAppointment = {
      ...appointmentData,
      createdAt: timeString,
      createdBy: userId,
    };
    
    //ID 생성
    const appointmentId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    newAppointment.id = appointmentId;

    //그룹에 약속 추가
    const groupDocRef = doc(groupsCollection, groupId);
    await updateDoc(groupDocRef, {
      appointments: arrayUnion(newAppointment),
    });

    return newAppointment;
  } catch (err) {
    throw err;
  }
};

//일정 삭제 관리자만 가능
export const deleteGroupAppointment = async (
  groupId,
  appointmentId,
  userId,
) => {
  try {
    //관리자 체크
    const memberRef = doc(groupMembersCollection, `${groupId}_${userId}`);
    const adminCheck = await getDoc(memberRef);
    const hasDoc = adminCheck.exists();
    if (!hasDoc) {
      throw new Error('Not admin');
    }
    const userData = adminCheck.data();
    const userRole = userData.role;
    const isManagerRole = userRole === 'admin';
    if (!isManagerRole) {
      throw new Error('Not admin');
    }
  } catch (e) {
    throw e;
  }

  //그룹 문서 가져오기
  const groupDocRef = doc(groupsCollection, groupId);
  const groupInfo = await getDoc(groupDocRef);
  const groupExists = groupInfo.exists();
  if (!groupExists) {
    throw new Error('Group not found');
  }

  //기존 약속들에서 해당 약속 제거
  const groupData = groupInfo.data();
  const currentAppointments = groupData.appointments;
  const appointmentsList = currentAppointments || [];
  let filteredAppointments = [];
  let foundTarget = false;
  for (let i = 0; i < appointmentsList.length; i++) {
    const appointment = appointmentsList[i];
    const appointmentIdMatch = appointment.id === appointmentId;
    if (!appointmentIdMatch) {
      filteredAppointments.push(appointment);
    } else {
      foundTarget = true; //찾았다는 표시
    }
  }
  //못찾았으면 에러
  if (!foundTarget) {
    console.warn('약속을 찾을 수 없음:', appointmentId);
  }

  await updateDoc(doc(groupsCollection, groupId), {
    appointments: filteredAppointments,
  });

  return true;
};

//사용자 가능시간 저장
export const saveUserAvailability = async (
  groupId,
  userId,
  availabilityData,
) => {
  try {
    //멤버인지 확인부터 이거 안하면 아무나 저장할 수 있음
    const memberDocId = `${groupId}_${userId}`;
    const memberRef = doc(groupMembersCollection, memberDocId);
    const memberCheck = await getDoc(memberRef);
    const isMember = memberCheck.exists();
    if (!isMember) {
      throw new Error('Not a member');
    }
    const memberData = memberCheck.data();
    //혹시 몰라서 역할도 체크
    if (!memberData.role) {
      console.warn('멤버 역할이 없음');
    }

    //가능시간 문서 레퍼런스
    const availDocId = `${groupId}_${userId}`;
    const availRef = doc(firestore, 'groupAvailability', availDocId);
    
    //데이터 준비
    const unavailableList = availabilityData.unavailableTimes;
    const timesList = unavailableList || [];
    const saveData = {
      groupId: groupId,
      userId: userId,
      unavailableTimes: timesList,
      lastUpdated: serverTimestamp(),
    };
    
    //병합 옵션으로 저장 기존 데이터 덮어쓰기
    const mergeOption = { merge: true };
    await setDoc(availRef, saveData, mergeOption);

    return true;
  } catch (e) {
    throw e;
  }
};

//그룹 전체 가능시간 가져오기
export const getGroupAvailability = async (groupId) => {
  try {
    const availQuery = query(
      availabilityCollection,
      where('groupId', '==', groupId),
    );

    const snapshot = await getDocs(availQuery);
    const result = {};
    let docCount = 0;

    //각 유저의 가능시간 정리
    snapshot.forEach((docItem) => {
      const docData = docItem.data();
      const userIdFromDoc = docData.userId;
      const unavailableArray = docData.unavailableTimes;
      const timesList = unavailableArray || [];
      const lastUpdateTime = docData.lastUpdated;
      
      result[userIdFromDoc] = {
        unavailableTimes: timesList,
        lastUpdated: lastUpdateTime,
      };
      docCount++;
    });
    
    //문서 개수 확인 디버깅용
    console.log(`가져온 가능시간 문서 개수: ${docCount}`);
    return result;
  } catch (e) {
    console.error('가능시간 조회 에러:', e);
    throw e;
  }
};

//그룹 만들기 메인 기능
export const createGroup = async (groupData, userId) => {
  try {
    //새 그룹 데이터 처리
    const currentTimestamp = serverTimestamp();
    const initialMemberCount = 1;
    const emptyRequests = [];
    
    const groupToCreate = {
      ...groupData,
      createdBy: userId,
      createdAt: currentTimestamp,
      memberCount: initialMemberCount,
      joinRequests: emptyRequests,
    };
    
    //appointments 필드도 미리 초기화
    if (!groupToCreate.appointments) {
      groupToCreate.appointments = [];
    }

    //그룹 문서 생성
    const newGroupRef = await addDoc(groupsCollection, groupToCreate);
    const newGroupId = newGroupRef.id;
    //ID 확인
    if (!newGroupId) {
      throw new Error('그룹 ID 생성 실패');
    }

    //생성자를 관리자로 추가
    await setDoc(doc(groupMembersCollection, `${newGroupId}_${userId}`), {
      groupId: newGroupId,
      userId: userId,
      role: 'admin',
      joinedAt: serverTimestamp(),
    });

    return { id: newGroupId, ...groupToCreate };
  } catch (e) {
    throw e;
  }
};

//그룹 ID로 찾기
export const getGroupById = async (groupId) => {
  const groupInfo = await getDoc(doc(groupsCollection, groupId));

  if (groupInfo.exists()) {
    return { id: groupInfo.id, ...groupInfo.data() };
  } else {
    throw new Error('Group not found');
  }
};

//모든 그룹 리스트 가져오기 페이지네이션 적용해봄
export const getAllGroups = async (lastGroup = null, limitCount = 10) => {
  try {
    let groupQuery;
    const hasLastGroup = lastGroup !== null;
    const defaultLimit = 10;
    const actualLimit = limitCount || defaultLimit;

    //마지막 그룹이 있으면 그 다음부터
    if (hasLastGroup) {
      const lastCreatedAt = lastGroup.createdAt;
      groupQuery = query(
        groupsCollection,
        orderBy('createdAt', 'desc'),
        where('createdAt', '<', lastCreatedAt),
        firestoreLimit(actualLimit),
      );
    } else {
      //처음 조회할 때
      groupQuery = query(
        groupsCollection,
        orderBy('createdAt', 'desc'),
        firestoreLimit(actualLimit),
      );
    }

    const snapshot = await getDocs(groupQuery);
    const groupList = [];
    let processedCount = 0;

    //각 그룹 데이터 처리
    snapshot.forEach((item) => {
      const docId = item.id;
      const docData = item.data();
      const groupWithId = { id: docId, ...docData };
      groupList.push(groupWithId);
      processedCount++;
    });
    
    //처리된 개수 로그
    console.log(`처리된 그룹 개수: ${processedCount}`);
    return groupList;
  } catch (e) {
    throw e;
  }
};

//태그로 그룹 찾기
export const searchGroupsByTags = async (tags, subject = null) => {
  let searchQuery;

  //과목이 있으면 과목도 같이 검색
  if (subject) {
    searchQuery = query(
      groupsCollection,
      where('subject', 'array-contains', subject),
      where('tags', 'array-contains-any', tags),
      orderBy('createdAt', 'desc'),
    );
  } else {
    searchQuery = query(
      groupsCollection,
      where('tags', 'array-contains-any', tags),
      orderBy('createdAt', 'desc'),
    );
  }

  const result = await getDocs(searchQuery);
  const foundGroups = [];

  result.forEach((item) => {
    foundGroups.push({ id: item.id, ...item.data() });
  });

  return foundGroups;
};

//그룹 가입 신청
export const sendJoinRequest = async (groupId, userId, message = '') => {
  try {
    //그룹 정보 가져오기
    const groupRef = doc(groupsCollection, groupId);
    const groupInfo = await getDoc(groupRef);
    const groupExists = groupInfo.exists();

    if (!groupExists) {
      throw new Error('Group not found');
    }
    
    const groupData = groupInfo.data();
    const requestsList = groupData.joinRequests || [];

    //이미 신청했는지 체크 중복 방지
    let alreadyRequested = false;
    let requestIndex = -1;
    for (let i = 0; i < requestsList.length; i++) {
      const request = requestsList[i];
      const requestUserId = request.uid;
      if (requestUserId === userId) {
        alreadyRequested = true;
        requestIndex = i;
        break;
      }
    }
    if (alreadyRequested) {
      console.warn(`이미 신청함: 인덱스 ${requestIndex}`);
      throw new Error('Already requested');
    }

    //이미 멤버인지 체크
    const memberCheck = await getDoc(
      doc(groupMembersCollection, `${groupId}_${userId}`),
    );
    if (memberCheck.exists()) {
      throw new Error('Already member');
    }

    //신청 데이터 만들기
    const currentDate = new Date();
    const requestMessage = message || '';
    const requestData = {
      uid: userId,
      requestedAt: currentDate,
      message: requestMessage,
    };
    
    //혹시 몰라서 데이터 검증
    if (!requestData.uid) {
      throw new Error('사용자 ID가 필요함');
    }

    //그룹에 신청 추가
    const groupDocRef = doc(groupsCollection, groupId);
    await updateDoc(groupDocRef, {
      joinRequests: arrayUnion(requestData),
    });

    return true;
  } catch (e) {
    throw e;
  }
};

//가입 신청 승인 관리자만
export const approveJoinRequest = async (groupId, userId, currentUserId) => {
  try {
    //관리자 권한 체크 중요함
    const adminDocId = `${groupId}_${currentUserId}`;
    const adminRef = doc(groupMembersCollection, adminDocId);
    const adminCheck = await getDoc(adminRef);
    const adminDocExists = adminCheck.exists();
    
    if (!adminDocExists) {
      throw new Error('Not admin');
    }
    
    const adminData = adminCheck.data();
    const adminRole = adminData.role;
    const hasAdminRole = adminRole === 'admin';
    
    if (!hasAdminRole) {
      throw new Error('Not admin');
    }

    //그룹 정보 확인
    const groupRef = doc(groupsCollection, groupId);
    const groupInfo = await getDoc(groupRef);
    const groupDocExists = groupInfo.exists();

    if (!groupDocExists) {
      throw new Error('Group not found');
    }
    
    const groupData = groupInfo.data();
    const currentMembers = groupData.memberCount || 0;
    const maxAllowed = groupData.maxMembers || 999; //기본값

    //인원 수 체크 정원 초과 방지
    const isFull = currentMembers >= maxAllowed;
    if (isFull) {
      console.warn(`그룹 정원 초과: ${currentMembers}/${maxAllowed}`);
      throw new Error('Group full');
    }

    //신청 목록에서 해당 신청 찾기
    const requestsList = groupData.joinRequests || [];
    let requestIdx = -1;
    let foundRequest = null;
    
    for (let i = 0; i < requestsList.length; i++) {
      const request = requestsList[i];
      const requestUid = request.uid;
      if (requestUid === userId) {
        requestIdx = i;
        foundRequest = request;
        break;
      }
    }
    
    if (requestIdx === -1) {
      console.error('가입 신청을 찾을 수 없음:', userId);
      throw new Error('Request not found');
    }

    //신청 목록에서 제거
    const newRequests = [...requestsList];
    const removedRequest = newRequests.splice(requestIdx, 1);
    console.log('제거된 신청:', removedRequest[0]);

    //그룹 업데이트
    const groupUpdateData = {
      joinRequests: newRequests,
      memberCount: increment(1),
    };
    await updateDoc(groupRef, groupUpdateData);

    //새 멤버 추가
    const newMemberDocId = `${groupId}_${userId}`;
    const memberRef = doc(groupMembersCollection, newMemberDocId);
    const newMemberData = {
      groupId: groupId,
      userId: userId,
      role: 'member',
      joinedAt: serverTimestamp(),
    };
    await setDoc(memberRef, newMemberData);
    
    console.log('새 멤버 추가 완료:', userId);

    return true;
  } catch (e) {
    throw e;
  }
};

//가입 신청 거절
export const rejectJoinRequest = async (groupId, userId, currentUserId) => {
  //관리자 체크
  const adminCheck = await getDoc(
    doc(groupMembersCollection, `${groupId}_${currentUserId}`),
  );
  if (!adminCheck.exists() || adminCheck.data().role !== 'admin') {
    throw new Error('Not admin');
  }

  const groupInfo = await getDoc(doc(groupsCollection, groupId));
  const groupData = groupInfo.data();

  if (!groupInfo.exists()) {
    throw new Error('Group not found');
  }

  //신청 찾기
  let idx = -1;
  for (let i = 0; i < groupData.joinRequests.length; i++) {
    if (groupData.joinRequests[i].uid === userId) {
      idx = i;
      break;
    }
  }
  if (idx === -1) {
    throw new Error('Request not found');
  }

  //신청 제거
  const updatedList = [...groupData.joinRequests];
  updatedList.splice(idx, 1);

  await updateDoc(doc(groupsCollection, groupId), {
    joinRequests: updatedList,
  });

  return true;
};

//그룹 나가기 관리자는 안됨
export const leaveGroup = async (groupId, userId) => {
  try {
    //멤버인지 체크
    const memberInfo = await getDoc(
      doc(groupMembersCollection, `${groupId}_${userId}`),
    );

    if (!memberInfo.exists()) {
      throw new Error('Not a member');
    }

    const userData = memberInfo.data();

    //관리자는 나갈 수 없음
    if (userData.role === 'admin') {
      throw new Error('Admin cannot leave. Transfer ownership first.');
    }

    //멤버 삭제
    await deleteDoc(doc(groupMembersCollection, `${groupId}_${userId}`));

    //그룹 인원수 감소
    await updateDoc(doc(groupsCollection, groupId), {
      memberCount: increment(-1),
    });

    return true;
  } catch (e) {
    throw e;
  }
};

//그룹 멤버 목록 가져오기
export const getGroupMembers = async (groupId) => {
  const memberQuery = query(
    groupMembersCollection,
    where('groupId', '==', groupId),
  );

  const snapshot = await getDocs(memberQuery);
  const memberList = [];

  snapshot.forEach((item) => {
    memberList.push(item.data());
  });

  return memberList;
};

//사용자가 속한 그룹들
export const getUserGroups = async (userId) => {
  try {
    //사용자가 속한 그룹 ID들 찾기
    const userMemberQuery = query(
      groupMembersCollection,
      where('userId', '==', userId),
    );

    const memberSnapshot = await getDocs(userMemberQuery);
    const groupIdList = [];
    let memberCount = 0;

    //각 멤버십 문서에서 그룹 ID 추출
    memberSnapshot.forEach((item) => {
      const memberData = item.data();
      const groupId = memberData.groupId;
      groupIdList.push(groupId);
      memberCount++;
    });
    
    console.log(`사용자 ${userId}의 그룹 개수: ${memberCount}`);

    //각 그룹 정보 가져오기 하나씩
    const userGroups = [];
    let processedGroups = 0;
    for (let i = 0; i < groupIdList.length; i++) {
      const groupId = groupIdList[i];
      const groupRef = doc(groupsCollection, groupId);
      const groupInfo = await getDoc(groupRef);
      const groupExists = groupInfo.exists();
      if (groupExists) {
        const groupData = groupInfo.data();
        const groupWithId = { id: groupId, ...groupData };
        userGroups.push(groupWithId);
        processedGroups++;
      } else {
        console.warn('존재하지 않는 그룹:', groupId);
      }
    }
    
    console.log(`처리된 그룹 정보: ${processedGroups}/${groupIdList.length}`);
    return userGroups;
  } catch (e) {
    throw e;
  }
};

//그룹 정보 수정
export const updateGroup = async (groupId, groupData, userId) => {
  //관리자 체크
  const adminCheck = await getDoc(
    doc(groupMembersCollection, `${groupId}_${userId}`),
  );
  if (!adminCheck.exists() || adminCheck.data().role !== 'admin') {
    throw new Error('Not admin');
  }

  //수정 불가능한 필드들 제거
  const { createdBy, createdAt, memberCount, joinRequests, ...dataToUpdate } =
    groupData;

  await updateDoc(doc(groupsCollection, groupId), dataToUpdate);

  return true;
};

//멤버 강퇴 관리자만 가능
export const removeMember = async (groupId, memberUserId, currentUserId) => {
  try {
    //관리자 권한 체크
    const adminCheck = await getDoc(
      doc(groupMembersCollection, `${groupId}_${currentUserId}`),
    );
    if (!adminCheck.exists() || adminCheck.data().role !== 'admin') {
      throw new Error('Not admin');
    }

    //제거할 멤버 정보 확인
    const targetMember = await getDoc(
      doc(groupMembersCollection, `${groupId}_${memberUserId}`),
    );
    if (!targetMember.exists()) {
      throw new Error('Member not found');
    }

    const targetData = targetMember.data();
    if (targetData.role === 'admin') {
      throw new Error('Cannot remove admin');
    }

    //멤버 제거
    await deleteDoc(doc(groupMembersCollection, `${groupId}_${memberUserId}`));

    //인원수 감소
    await updateDoc(doc(groupsCollection, groupId), {
      memberCount: increment(-1),
    });

    return true;
  } catch (e) {
    throw e;
  }
};

//그룹 완전 삭제 위험함
export const deleteGroup = async (groupId, userId) => {
  try {
    //관리자 체크
    const adminCheck = await getDoc(
      doc(groupMembersCollection, `${groupId}_${userId}`),
    );
    if (!adminCheck.exists() || adminCheck.data().role !== 'admin') {
      throw new Error('Not admin');
    }

    //모든 멤버 찾기
    const allMembersQuery = query(
      groupMembersCollection,
      where('groupId', '==', groupId),
    );

    const membersResult = await getDocs(allMembersQuery);

    //일괄 삭제를 위한 배치
    const batchDelete = writeBatch(firestore);

    //모든 멤버 삭제
    membersResult.forEach((memberItem) => {
      batchDelete.delete(memberItem.ref);
    });

    //그룹 자체도 삭제
    batchDelete.delete(doc(groupsCollection, groupId));

    await batchDelete.commit();

    return true;
  } catch (e) {
    throw e;
  }
};

//사용자의 모든 그룹 약속들
export const getUserGroupAppointments = async (userId) => {
  try {
    const myGroups = await getUserGroups(userId);
    const appointmentList = [];
    let totalAppointments = 0;

    //각 그룹의 약속들 수집 좀 복잡함
    for (let i = 0; i < myGroups.length; i++) {
      const group = myGroups[i];
      const groupId = group.id;
      const groupName = group.name || '이름없음';
      const appointments = group.appointments;
      
      //약속 배열이 있는지 확인
      const hasAppointments = appointments && Array.isArray(appointments);
      if (hasAppointments) {
        const appointmentCount = appointments.length;
        //각 약속에 그룹 정보 추가
        for (let j = 0; j < appointmentCount; j++) {
          const appointment = appointments[j];
          const appointmentWithGroupInfo = {
            ...appointment,
            groupId: groupId,
            groupName: groupName,
            isGroupEvent: true,
          };
          appointmentList.push(appointmentWithGroupInfo);
          totalAppointments++;
        }
      }
    }
    
    console.log(`총 그룹 약속 개수: ${totalAppointments}`);
    return appointmentList;
  } catch (e) {
    console.error('그룹 약속 조회 에러:', e);
    throw e;
  }
};

//기본 에포트 모든 기능들
export default {
  createGroup,
  getGroupById,
  getAllGroups,
  searchGroupsByTags,
  sendJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  leaveGroup,
  getGroupMembers,
  getUserGroups,
  updateGroup,
  removeMember,
  deleteGroup,
  saveGroupAppointment,
  deleteGroupAppointment,
  saveUserAvailability,
  getGroupAvailability,
  getUserGroupAppointments,
};
