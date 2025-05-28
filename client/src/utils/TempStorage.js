// 임시 사용자 데이터 관리 유틸리티

/**
 * 임시 사용자 데이터를 로컬 스토리지에 안전하게 저장하는 유틸리티 함수들
 * 회원가입 과정에서 인증번호 검증 단계에서 사용자 데이터를 임시 저장하기 위한 목적
 */

/**
 * 비밀번호를 간단히 암호화하는 함수
 * 참고: 실제 프로덕션에서는 더 강력한 암호화 방식을 사용해야 함
 * 
 * @param {string} password - 암호화할 비밀번호
 * @returns {string} - 암호화된 비밀번호
 */
export const encryptPassword = (password) => {
    // 기본적인 Base64 인코딩 사용 (테스트용)
    const encoded = window.btoa(
      encodeURIComponent(password).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode('0x' + p1);
      })
    );
    return encoded;
  };
  
  /**
   * 암호화된 비밀번호를 복호화하는 함수
   * 
   * @param {string} encodedPassword - 암호화된 비밀번호
   * @returns {string} - 복호화된 원본 비밀번호
   */
  export const decryptPassword = (encodedPassword) => {
    try {
      // Base64 디코딩
      const decoded = decodeURIComponent(
        Array.prototype.map.call(
          window.atob(encodedPassword),
          (c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }
        ).join('')
      );
      return decoded;
    } catch (error) {
      console.error('비밀번호 복호화 중 오류:', error);
      return null;
    }
  };
  
  /**
   * 임시 사용자 데이터를 로컬 스토리지에 저장
   * 
   * @param {Object} userData - 저장할 사용자 데이터
   * @param {string} userData.email - 이메일
   * @param {string} userData.password - 비밀번호
   * @param {string} userData.displayName - 표시 이름
   * @param {number} expiresIn - 만료 시간(밀리초), 기본값 10분
   * @returns {boolean} - 저장 성공 여부
   */
  export const saveTempUserData = (userData, expiresIn = 10 * 60 * 1000) => {
    try {
      // 필수 데이터 확인
      if (!userData.email || !userData.password || !userData.displayName) {
        console.error('임시 저장 오류: 필수 데이터 누락');
        return false;
      }
      
      // 비밀번호 암호화
      const encryptedPassword = encryptPassword(userData.password);
      
      // 저장할 데이터 준비
      const dataToStore = {
        email: userData.email,
        password: encryptedPassword, // 암호화된 비밀번호 저장
        displayName: userData.displayName,
        timestamp: Date.now(),
        expiresIn: expiresIn
      };
      
      // 로컬 스토리지에 저장
      localStorage.setItem('tempUserData', JSON.stringify(dataToStore));
      
      console.log('임시 사용자 데이터 저장 완료, 만료 시간:', new Date(Date.now() + expiresIn));
      return true;
    } catch (error) {
      console.error('임시 데이터 저장 오류:', error);
      return false;
    }
  };
  
  /**
   * 임시 사용자 데이터를 로컬 스토리지에서 가져오기
   * 
   * @returns {Object|null} - 저장된 사용자 데이터 또는 null
   */
  export const getTempUserData = () => {
    try {
      const data = localStorage.getItem('tempUserData');
      if (!data) return null;
      
      const parsedData = JSON.parse(data);
      
      // 만료 확인
      const now = Date.now();
      if (now - parsedData.timestamp > parsedData.expiresIn) {
        // 만료된 데이터는 삭제
        localStorage.removeItem('tempUserData');
        console.log('만료된 임시 데이터 삭제됨');
        return null;
      }
      
      // 비밀번호 복호화
      const decryptedPassword = decryptPassword(parsedData.password);
      if (!decryptedPassword) {
        // 복호화 실패 시 삭제
        localStorage.removeItem('tempUserData');
        return null;
      }
      
      // 데이터 반환
      return {
        ...parsedData,
        password: decryptedPassword, // 복호화된 비밀번호로 교체
        expiryDate: new Date(parsedData.timestamp + parsedData.expiresIn)
      };
    } catch (error) {
      console.error('임시 데이터 로드 오류:', error);
      localStorage.removeItem('tempUserData');
      return null;
    }
  };
  
  /**
   * 임시 사용자 데이터 삭제
   * 
   * @returns {boolean} - 삭제 성공 여부
   */
  export const clearTempUserData = () => {
    try {
      localStorage.removeItem('tempUserData');
      console.log('임시 사용자 데이터 삭제 완료');
      return true;
    } catch (error) {
      console.error('임시 데이터 삭제 오류:', error);
      return false;
    }
  };
  
  /**
   * 만료된 모든 임시 데이터 정리
   */
  export const cleanupExpiredTempData = () => {
    try {
      const data = localStorage.getItem('tempUserData');
      if (!data) return;
      
      const parsedData = JSON.parse(data);
      const now = Date.now();
      
      if (now - parsedData.timestamp > parsedData.expiresIn) {
        localStorage.removeItem('tempUserData');
        console.log('만료된 임시 데이터 정리됨');
      }
    } catch (error) {
      // 손상된 데이터 제거
      localStorage.removeItem('tempUserData');
      console.error('임시 데이터 정리 중 오류:', error);
    }
  };
  
  export default {
    saveTempUserData,
    getTempUserData,
    clearTempUserData,
    cleanupExpiredTempData
  };