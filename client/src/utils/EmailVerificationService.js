import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = 'http://localhost:5000';

/**
 * 이메일 인증 서비스
 * - 서버와 통신하여 이메일 인증 기능을 제공하는 모듈
 */
const EmailVerificationService = {
  /**
   * 인증번호 요청 함수
   * @param {string} email - 인증할 이메일 주소
   * @returns {Promise<Object>} - 서버 응답 객체
   */
  async requestVerificationCode(email) {
    try {
      console.log('인증번호 요청 시작:', email);
      
      // UnivCert API 요청 형식에 맞게 데이터 구성
      const requestData = {
        email: email,
        univName: '충북대학교',
        univ_check: true // 대학 재학 여부까지 확인
      };
      
      // 서버에 인증번호 요청
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-email`, requestData);
      
      console.log('인증번호 요청 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('인증번호 요청 실패:', error.response?.data || error.message);
      
      // 에러 응답 반환
      if (error.response?.data) {
        throw new Error(error.response.data.message || '인증번호 요청에 실패했습니다.');
      }
      throw new Error('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
    }
  },
  
  /**
   * 인증번호 검증 함수
   * @param {string} email - 인증 이메일 주소
   * @param {string} code - 입력한 인증번호
   * @returns {Promise<Object>} - 서버 응답 객체
   */
  async verifyCode(email, code) {
    try {
      console.log('인증번호 검증 시작:', { email, code });
      
      // UnivCert API 요청 형식에 맞게 데이터 구성
      const requestData = { 
        email: email,
        univName: '충북대학교',
        code: parseInt(code.trim(), 10) // 문자열을 정수로 변환 (API 요구사항)
      };
      
      // 서버에 인증번호 검증 요청
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-code`, requestData);
      
      console.log('인증번호 검증 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('인증번호 검증 실패:', error.response?.data || error.message);
      
      if (error.response?.data) {
        throw new Error(error.response.data.message || '인증번호 검증에 실패했습니다.');
      }
      throw new Error('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
    }
  },
  
  /**
   * 이메일 인증 요청 - 기존 함수 (유지)
   * @param {string} email - 인증할 이메일 주소
   * @returns {Promise<Object>} - 서버 응답 객체
   */
  async verifyEmail(email) {
    try {
      // 상세 로깅
      console.log('이메일 인증 요청 보내기 시작:', email);
      
      // 서버에 이메일 인증 요청
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-email`, { email });
      
      console.log('이메일 인증 요청 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('이메일 인증 요청 실패:', error.response?.data || error.message);
      
      // 에러 응답 반환
      if (error.response?.data) {
        throw new Error(error.response.data.message || '이메일 인증 요청에 실패했습니다.');
      }
      throw new Error('서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
    }
  },
  
  /**
   * 이메일 인증 상태 확인 - 기존 함수 (유지)
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