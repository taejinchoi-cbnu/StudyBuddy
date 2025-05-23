import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = 'http://localhost:5000';

const EmailVerificationService = {
  /**
   * 이메일 인증 요청 함수
   * @param {string} email - 인증할 이메일 주소
   * @returns {Promise<Object>} - 서버 응답 객체
   */
  async verifyEmail(email) {
    try {
      // 상세 로깅
      console.log('이메일 유효성 확인 요청 보내기 시작:', email);
      
      // 서버에 이메일 인증 요청 (univName 파라미터 추가)
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-email`, { 
        email, 
        univName: '충북대학교',
        univ_check: true  // 대학 재학 여부까지 확인
      });
      
      console.log('이메일 유효성 확인 요청 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('이메일 유효성 확인 요청 실패:', error.response?.data || error.message);
      
      // 에러 응답 반환
      if (error.response?.data) {
        throw new Error(error.response.data.message || '이메일 검증에 실패했습니다.');
      }
      throw new Error('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
    }
  },
  
  /**
   * 이메일 인증 상태 확인 함수
   * @param {string} email - 확인할 이메일 주소
   * @returns {Promise<Object>} - 서버 응답 객체
   */
  async checkVerificationStatus(email) {
    try {
      console.log('이메일 인증 상태 확인 시작:', email);
      
      // 서버에 이메일 인증 상태 확인 요청
      const response = await axios.post(`${API_BASE_URL}/api/auth/check-status`, { email });
      
      console.log('이메일 인증 상태 확인 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('이메일 인증 상태 확인 실패:', error.response?.data || error.message);
      
      // API가 404를 반환하면 인증되지 않은 것으로 처리
      if (error.response?.status === 404) {
        return { success: false, verified: false, message: '인증되지 않은 이메일입니다.' };
      }
      
      if (error.response?.data) {
        throw new Error(error.response.data.message || '이메일 인증 상태 확인에 실패했습니다.');
      }
      throw new Error('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
    }
  }
};

export default EmailVerificationService;