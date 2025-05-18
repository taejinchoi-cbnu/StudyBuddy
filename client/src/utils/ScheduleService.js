import { firestore } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

// 사용자 일정 컬렉션 참조
const userEventsCollection = collection(firestore, 'userEvents');

// 사용자 일정 가져오기
export const getUserEvents = async (userId) => {
  try {
    const eventsQuery = query(
      userEventsCollection,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(eventsQuery);
    const events = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // 시작 및 종료 시간이 유효한 Timestamp인지 확인
      let start, end;
      try {
        start = data.start.toDate();
        end = data.end.toDate();
      } catch (e) {
        console.error('Invalid date format in event:', doc.id);
        return; // 유효하지 않은 날짜가 있는 이벤트는 건너뜁니다
      }
      
      events.push({
        id: doc.id,
        title: data.title,
        start: start,
        end: end,
        description: data.description || '',
        allDay: data.allDay || false,
        isGroupEvent: false
      });
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching user events:', error);
    return []; // 오류 발생 시 빈 배열 반환
  }
};

// 일정 추가
export const addUserEvent = async (userId, eventData) => {
  try {
    // Firebase에 저장할 데이터 준비
    const eventToSave = {
      userId,
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      description: eventData.description || '',
      allDay: eventData.allDay || false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(userEventsCollection, eventToSave);
    
    return {
      id: docRef.id,
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      description: eventData.description || '',
      allDay: eventData.allDay || false,
      isGroupEvent: false
    };
  } catch (error) {
    console.error('Error adding user event:', error);
    throw error;
  }
};

// 일정 업데이트
export const updateUserEvent = async (userId, eventData) => {
  try {
    const { id, ...data } = eventData;
    
    // 문서 존재 및 소유권 확인
    const eventRef = doc(userEventsCollection, id);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }
    
    if (eventDoc.data().userId !== userId) {
      throw new Error('Permission denied');
    }
    
    // 업데이트할 데이터 준비
    const eventToUpdate = {
      title: data.title,
      start: data.start,
      end: data.end,
      description: data.description || '',
      allDay: data.allDay || false,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(eventRef, eventToUpdate);
    
    return {
      id,
      title: data.title,
      start: data.start,
      end: data.end,
      description: data.description || '',
      allDay: data.allDay || false,
      isGroupEvent: false
    };
  } catch (error) {
    console.error('Error updating user event:', error);
    throw error;
  }
};

// 일정 삭제
export const deleteUserEvent = async (userId, eventId) => {
  try {
    // 문서 존재 및 소유권 확인
    const eventRef = doc(userEventsCollection, eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }
    
    if (eventDoc.data().userId !== userId) {
      throw new Error('Permission denied');
    }
    
    await deleteDoc(eventRef);
    return true;
  } catch (error) {
    console.error('Error deleting user event:', error);
    throw error;
  }
};

export default {
  getUserEvents,
  addUserEvent,
  updateUserEvent,
  deleteUserEvent
};