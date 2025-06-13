import axios from 'axios';

//서버 URL 나중에 .env로 빼야함
const serverURL = 'http://localhost:3000';

//이메일 인증 관련 함수들
const EmailVerificationService = {
  //이메일 인증 하기
  async verifyEmail(email) {
    try {
      //요청 데이터 만들기
      const requestData = {
        email: email,
        univName: '충북대학교',
        univ_check: true
      };
      
      //API 호출
      const result = await axios.post(
        serverURL + '/api/auth/verify-email',
        requestData
      );

      return result.data;
    } catch (err) {
      console.log('인증 에러:', err);
      
      //에러 처리 좋지 않음
      if (err.response && err.response.data) {
        throw new Error(err.response.data.message || '인증 실패');
      }
      throw new Error('서버 연결 실패');
    }
  },

  //인증 상태 확인하는거
  async checkStatus(email) {
    try {
      const response = await axios.post(
        `${serverURL}/api/auth/check-status`,
        { email: email }
      );

      return response.data;
    } catch (error) {
      //404 에러는 인증 안된거로 처리
      if (error.response?.status === 404) {
        return {
          success: false,
          verified: false,
          message: '인증 안됨'
        };
      }

      if (error.response?.data) {
        throw new Error(error.response.data.message || '상태 확인 실패');
      }
      
      throw new Error('서버 에러');
    }
  },
  
  //추가로 만든 함수 잠시만 사용
  async quickCheck(email) {
    try {
      const result = await this.checkStatus(email);
      return result.success;
    } catch (e) {
      console.warn('Email check error:', e);
      return false;
    }
  }
};

//이메일 유효성 간단 체크 대충
function isChungbukEmail(email) {
  return email && email.includes('@chungbuk.ac.kr');
}

//전역에서 사용할 수 있게
EmailVerificationService.isValidEmail = isChungbukEmail;

export default EmailVerificationService;
