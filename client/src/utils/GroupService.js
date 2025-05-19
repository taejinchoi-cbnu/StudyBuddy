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
  limit as firestoreLimit, // 이름 변경하여 충돌 방지
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  increment,
  writeBatch
} from 'firebase/firestore';

// 그룹 관련 컬렉션 레퍼런스
const groupsCollection = collection(firestore, 'groups');
const groupMembersCollection = collection(firestore, 'groupMembers');

// 그룹에 일정 저장 함수
export const saveGroupAppointment = async (groupId, appointmentData, userId) => {
  try {
    // 현재 사용자가 관리자인지 확인
    const adminDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${userId}`));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      throw new Error('Permission denied: Not a group admin');
    }
    
    // 그룹 문서 업데이트
    await updateDoc(doc(groupsCollection, groupId), {
      appointments: arrayUnion(appointmentData)
    });
    
    return true;
  } catch (error) {
    console.error('Error saving group appointment:', error);
    throw error;
  }
};

// 특정 일정 ID로 일정 삭제 함수
export const deleteGroupAppointment = async (groupId, appointmentId, userId) => {
  try {
    // 현재 사용자가 관리자인지 확인
    const adminDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${userId}`));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      throw new Error('Permission denied: Not a group admin');
    }
    
    // 먼저 그룹 문서 가져오기
    const groupDoc = await getDoc(doc(groupsCollection, groupId));
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const appointments = groupDoc.data().appointments || [];
    const updatedAppointments = appointments.filter(app => app.id !== appointmentId);
    
    // 그룹 문서 업데이트
    await updateDoc(doc(groupsCollection, groupId), {
      appointments: updatedAppointments
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting group appointment:', error);
    throw error;
  }
};

// 새 그룹 생성
export const createGroup = async (groupData, userId) => {
  try {
    // 그룹 기본 정보 생성
    const newGroup = {
      ...groupData,
      createdBy: userId,
      createdAt: serverTimestamp(),
      memberCount: 1, // 생성자를 포함한 멤버 수
      joinRequests: []
    };
    
    // Firestore에 그룹 추가
    const groupRef = await addDoc(groupsCollection, newGroup);
    const groupId = groupRef.id;
    
    // 그룹 멤버 정보 추가 (생성자는 자동으로 admin)
    await setDoc(doc(groupMembersCollection, `${groupId}_${userId}`), {
      groupId: groupId,
      userId: userId,
      role: 'admin',
      joinedAt: serverTimestamp()
    });
    
    return { id: groupId, ...newGroup };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// 그룹 정보 가져오기
export const getGroupById = async (groupId) => {
  try {
    const groupDoc = await getDoc(doc(groupsCollection, groupId));
    
    if (groupDoc.exists()) {
      return { id: groupDoc.id, ...groupDoc.data() };
    } else {
      throw new Error('Group not found');
    }
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
};

// 모든 그룹 가져오기 (페이지네이션 적용)
export const getAllGroups = async (lastGroup = null, limitCount = 10) => {
  try {
    let groupsQuery;
    
    if (lastGroup) {
      groupsQuery = query(
        groupsCollection,
        orderBy('createdAt', 'desc'),
        where('createdAt', '<', lastGroup.createdAt),
        firestoreLimit(limitCount) // firestoreLimit 사용
      );
    } else {
      groupsQuery = query(
        groupsCollection,
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount) // firestoreLimit 사용
      );
    }
    
    const querySnapshot = await getDocs(groupsQuery);
    const groups = [];
    
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    
    return groups;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};

// 태그/주제로 그룹 검색
export const searchGroupsByTags = async (tags, subject = null) => {
  try {
    let groupsQuery;
    
    if (subject) {
      groupsQuery = query(
        groupsCollection,
        where('subject', 'array-contains', subject),
        where('tags', 'array-contains-any', tags),
        orderBy('createdAt', 'desc')
      );
    } else {
      groupsQuery = query(
        groupsCollection,
        where('tags', 'array-contains-any', tags),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(groupsQuery);
    const groups = [];
    
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    
    return groups;
  } catch (error) {
    console.error('Error searching groups:', error);
    throw error;
  }
};

// 그룹 가입 요청 보내기 (수정됨)
export const sendJoinRequest = async (groupId, userId, message = '') => {
  try {
    // 이미 가입 요청을 보냈는지 확인
    const groupDoc = await getDoc(doc(groupsCollection, groupId));
    const groupData = groupDoc.data();
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    const existingRequest = groupData.joinRequests.find(request => request.uid === userId);
    if (existingRequest) {
      throw new Error('Join request already sent');
    }
    
    // 이미 멤버인지 확인
    const memberDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${userId}`));
    if (memberDoc.exists()) {
      throw new Error('Already a member of this group');
    }
    
    // 가입 요청 추가
    // serverTimestamp() 대신 JavaScript Date 객체 사용
    const joinRequest = {
      uid: userId,
      requestedAt: new Date(),
      message: message || ''
    };
    
    await updateDoc(doc(groupsCollection, groupId), {
      joinRequests: arrayUnion(joinRequest)
    });
    
    return true;
  } catch (error) {
    console.error('Error sending join request:', error);
    throw error;
  }
};

// 그룹 가입 요청 승인
export const approveJoinRequest = async (groupId, userId, currentUserId) => {
  try {
    // 현재 사용자가 관리자인지 확인
    const adminDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${currentUserId}`));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      throw new Error('Permission denied: Not a group admin');
    }
    
    // 그룹 정보 가져오기
    const groupDoc = await getDoc(doc(groupsCollection, groupId));
    const groupData = groupDoc.data();
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    // 최대 인원수 확인
    if (groupData.memberCount >= groupData.maxMembers) {
      throw new Error('Group is full');
    }
    
    // 가입 요청 찾기
    const requestIndex = groupData.joinRequests.findIndex(request => request.uid === userId);
    if (requestIndex === -1) {
      throw new Error('Join request not found');
    }
    
    // 가입 요청 배열에서 제거
    const updatedRequests = [...groupData.joinRequests];
    updatedRequests.splice(requestIndex, 1);
    
    // 그룹 문서 업데이트
    await updateDoc(doc(groupsCollection, groupId), {
      joinRequests: updatedRequests,
      memberCount: increment(1)
    });
    
    // 그룹 멤버 추가
    await setDoc(doc(groupMembersCollection, `${groupId}_${userId}`), {
      groupId: groupId,
      userId: userId,
      role: 'member',
      joinedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error approving join request:', error);
    throw error;
  }
};

// 그룹 가입 요청 거절
export const rejectJoinRequest = async (groupId, userId, currentUserId) => {
  try {
    // 현재 사용자가 관리자인지 확인
    const adminDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${currentUserId}`));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      throw new Error('Permission denied: Not a group admin');
    }
    
    // 그룹 정보 가져오기
    const groupDoc = await getDoc(doc(groupsCollection, groupId));
    const groupData = groupDoc.data();
    
    if (!groupDoc.exists()) {
      throw new Error('Group not found');
    }
    
    // 가입 요청 찾기
    const requestIndex = groupData.joinRequests.findIndex(request => request.uid === userId);
    if (requestIndex === -1) {
      throw new Error('Join request not found');
    }
    
    // 가입 요청 배열에서 제거
    const updatedRequests = [...groupData.joinRequests];
    updatedRequests.splice(requestIndex, 1);
    
    // 그룹 문서 업데이트
    await updateDoc(doc(groupsCollection, groupId), {
      joinRequests: updatedRequests
    });
    
    return true;
  } catch (error) {
    console.error('Error rejecting join request:', error);
    throw error;
  }
};

// 그룹 탈퇴
export const leaveGroup = async (groupId, userId) => {
  try {
    // 멤버 문서 가져오기
    const memberDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${userId}`));
    
    if (!memberDoc.exists()) {
      throw new Error('Not a member of this group');
    }
    
    const memberData = memberDoc.data();
    
    // 관리자가 탈퇴하려는 경우 다른 관리자 지정 필요
    if (memberData.role === 'admin') {
      // 다른 멤버가 있는지 확인하고 관리자 권한 이양 로직 필요
      // 이 부분은 추후 구현
      throw new Error('Admin cannot leave the group. Transfer ownership first.');
    }
    
    // 멤버 문서 삭제
    await deleteDoc(doc(groupMembersCollection, `${groupId}_${userId}`));
    
    // 그룹 문서 멤버 수 감소
    await updateDoc(doc(groupsCollection, groupId), {
      memberCount: increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
};

// 그룹 멤버 목록 가져오기
export const getGroupMembers = async (groupId) => {
  try {
    const membersQuery = query(
      groupMembersCollection,
      where('groupId', '==', groupId)
    );
    
    const querySnapshot = await getDocs(membersQuery);
    const members = [];
    
    querySnapshot.forEach((doc) => {
      members.push(doc.data());
    });
    
    return members;
  } catch (error) {
    console.error('Error fetching group members:', error);
    throw error;
  }
};

// 사용자가 속한 그룹 가져오기
export const getUserGroups = async (userId) => {
  try {
    const membersQuery = query(
      groupMembersCollection,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(membersQuery);
    const groupIds = [];
    
    querySnapshot.forEach((doc) => {
      groupIds.push(doc.data().groupId);
    });
    
    // 그룹 정보 가져오기
    const groups = [];
    for (const groupId of groupIds) {
      const groupDoc = await getDoc(doc(groupsCollection, groupId));
      if (groupDoc.exists()) {
        groups.push({ id: groupId, ...groupDoc.data() });
      }
    }
    
    return groups;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw error;
  }
};

// 그룹 정보 업데이트
export const updateGroup = async (groupId, groupData, userId) => {
  try {
    // 현재 사용자가 관리자인지 확인
    const adminDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${userId}`));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      throw new Error('Permission denied: Not a group admin');
    }
    
    // 업데이트할 수 없는 필드 제거
    const { createdBy, createdAt, memberCount, joinRequests, ...updatableData } = groupData;
    
    // 그룹 문서 업데이트
    await updateDoc(doc(groupsCollection, groupId), updatableData);
    
    return true;
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

// 그룹 관리자가 멤버 제거하기
export const removeMember = async (groupId, memberUserId, currentUserId) => {
  try {
    // 현재 사용자가 관리자인지 확인
    const adminDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${currentUserId}`));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      throw new Error('Permission denied: Not a group admin');
    }
    
    // 제거할 멤버가 존재하는지 확인
    const memberDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${memberUserId}`));
    if (!memberDoc.exists()) {
      throw new Error('Member not found');
    }
    
    // 제거할 멤버가 관리자인지 확인 (관리자는 제거할 수 없음)
    const memberData = memberDoc.data();
    if (memberData.role === 'admin') {
      throw new Error('Cannot remove an admin member');
    }
    
    // 멤버 문서 삭제
    await deleteDoc(doc(groupMembersCollection, `${groupId}_${memberUserId}`));
    
    // 그룹 문서 멤버 수 감소
    await updateDoc(doc(groupsCollection, groupId), {
      memberCount: increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error('Error removing member:', error);
    throw error;
  }
};

// 그룹 삭제하기 (관리자만 가능)
export const deleteGroup = async (groupId, userId) => {
  try {
    // 현재 사용자가 관리자인지 확인
    const adminDoc = await getDoc(doc(groupMembersCollection, `${groupId}_${userId}`));
    if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
      throw new Error('Permission denied: Not a group admin');
    }
    
    // 모든 그룹 멤버 가져오기
    const membersQuery = query(
      groupMembersCollection,
      where('groupId', '==', groupId)
    );
    
    const memberSnapshot = await getDocs(membersQuery);
    
    // 모든 멤버 문서 삭제 (배치 작업)
    const batch = writeBatch(firestore);
    
    memberSnapshot.forEach((memberDoc) => {
      batch.delete(memberDoc.ref);
    });
    
    // 그룹 문서 삭제
    batch.delete(doc(groupsCollection, groupId));
    
    // 배치 작업 실행
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

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
  deleteGroupAppointment
};