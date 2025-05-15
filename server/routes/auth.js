const express = require('express');
const router = express.Router();
const axios = require('axios');
const { firestore } = require('../config/firebase');

// 기존 도메인 검증 함수
const isValidChungbukEmail = (email) => {
  return email.endsWith('@chungbuk.ac.kr');
};

// 이메일 인증 요청 API - UnivCert API에 맞게 수정
router.post('/verify-email', async (req, res) => {
  try {
    const { email, univName } = req.body;
    
    console.log(`[인증 요청] 이메일: ${email}, 대학: ${univName || '충북대학교'}, 시간: ${new Date().toISOString()}`);
    
    // 기본 이메일 형식 검증
    if (!email || !isValidChungbukEmail(email)) {
      console.log(`[인증 실패] 잘못된 이메일 형식: ${email}`);
      return res.status(400).json({ 
        success: false, 
        message: '유효한 충북대학교 이메일(@chungbuk.ac.kr)을 입력해주세요.' 
      });
    }
    
    try {
      // API 요청 객체 미리 생성하여 로깅
      const requestData = {
        key: process.env.UNIVCERT_API_KEY,
        email: email,
        univName: univName || '충북대학교',
        univ_check: true // 대학 재학 여부까지 확인
      };
      
      console.log(`[UnivCert API 호출] 요청 데이터:`, {
        ...requestData,
        key: '***' // API 키는 보안상 로그에 표시하지 않음
      });
      
      // UnivCert API 호출
      const response = await axios.post('https://univcert.com/api/v1/certify', requestData);
      
      // API 응답 로깅
      console.log(`[UnivCert API 응답] 상태: ${response.status}, 데이터:`, response.data);
      
      if (response.data.success) {
        // 성공 응답 - 이 시점에서 재학 여부가 확인됨
        console.log(`[인증 성공] 이메일: ${email}, 인증 완료`);
        return res.status(200).json({
          success: true,
          message: '인증번호가 발송되었습니다. 이메일을 확인해주세요.'
        });
      } else {
        console.log(`[인증 실패] 이메일: ${email}, 원인: API 성공 응답 아님`);
        return res.status(400).json({
          success: false,
          message: response.data.message || '이메일 인증에 실패했습니다.'
        });
      }
    } catch (error) {
      // 에러 상세 정보 로깅
      console.error(`[UnivCert API 에러] 이메일: ${email}, 에러:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // 이미 인증된 이메일인 경우
      if (error.response?.data?.message === '이미 완료된 요청입니다.') {
        console.log(`[인증 체크] 이메일: ${email}이 이미 인증된 상태, 상태 확인 진행`);
        
        // 인증 상태 확인
        try {
          console.log(`[상태 확인 API 호출] 이메일: ${email}`);
          const statusResponse = await axios.post('https://univcert.com/api/v1/status', {
            key: process.env.UNIVCERT_API_KEY,
            email: email
          });
          
          console.log(`[상태 확인 API 응답] 이메일: ${email}, 데이터:`, statusResponse.data);
          
          if (statusResponse.data.success) {
            console.log(`[인증 확인됨] 이메일: ${email}, 인증일: ${statusResponse.data.certified_date}`);
            return res.status(200).json({
              success: true,
              directVerified: true,
              message: '이미 인증된 이메일입니다.',
              certified_date: statusResponse.data.certified_date
            });
          }
        } catch (statusError) {
          console.error(`[상태 확인 API 에러] 이메일: ${email}, 에러:`, {
            status: statusError.response?.status,
            data: statusError.response?.data,
            message: statusError.message
          });
        }
        
        return res.status(200).json({
          success: true,
          alreadySent: true,
          message: '이미 인증 절차가 진행 중입니다.'
        });
      }
      
      // 인증 요청 거부 케이스 (학교 도메인이 맞지만 존재하지 않는 이메일)
      if (error.response?.status === 400 && error.response?.data?.message) {
        console.log(`[인증 실패] 이메일: ${email}, 원인: ${error.response.data.message}`);
        return res.status(400).json({
          success: false,
          message: error.response.data.message
        });
      }
      
      // 기타 오류 처리
      console.error(`[서버 오류] 이메일 인증 중 예상치 못한 오류 발생, 이메일: ${email}`);
      return res.status(error.response?.status || 500).json({
        success: false,
        message: error.response?.data?.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
  } catch (error) {
    console.error('이메일 인증 요청 처리 중 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다. 관리자에게 문의해주세요.'
    });
  }
});

// 인증 코드 확인 API - UnivCert API에 맞게 수정
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, univName, uid } = req.body;
    
    console.log(`[인증 코드 확인 요청] 이메일: ${email}, 코드: ${code}, 대학: ${univName || '충북대학교'}, 사용자ID: ${uid || 'N/A'}, 시간: ${new Date().toISOString()}`);
    
    // 입력값 검증
    if (!email || !code) {
      console.log(`[인증 코드 확인 실패] 필수 입력값 누락, 이메일: ${email}, 코드 제공 여부: ${!!code}`);
      return res.status(400).json({
        success: false,
        message: '이메일과 인증 코드를 모두 입력해주세요.'
      });
    }
    
    // 이메일 형식 검증
    if (!isValidChungbukEmail(email)) {
      console.log(`[인증 코드 확인 실패] 잘못된 이메일 형식: ${email}`);
      return res.status(400).json({
        success: false,
        message: '유효한 충북대학교 이메일이 아닙니다.'
      });
    }
    
    try {
      console.log(`[인증 코드 API 호출] 이메일: ${email}, 코드: ${code}`);
      
      // UnivCert API 요청 객체 생성
      const requestData = {
        key: process.env.UNIVCERT_API_KEY,
        email: email,
        univName: univName || '충북대학교',
        code: parseInt(code) // 문자열을 정수로 변환
      };
      
      // UnivCert API 호출하여 인증 코드 확인
      const response = await axios.post('https://univcert.com/api/v1/certifycode', requestData);
      
      console.log(`[인증 코드 API 응답] 상태: ${response.status}, 데이터:`, response.data);
      
      if (response.data.success) {
        console.log(`[인증 코드 확인 성공] 이메일: ${email}`);
        
        // 유저 ID가 제공된 경우, Firestore에 인증 상태 업데이트
        if (uid) {
          try {
            console.log(`[Firestore 업데이트] 사용자ID: ${uid}, 인증 상태 업데이트 시작`);
            const userRef = firestore.collection('users').doc(uid);
            await userRef.update({
              certified_email: true,
              certified_date: response.data.certified_date || new Date().toISOString()
            });
            console.log(`[Firestore 업데이트 성공] 사용자ID: ${uid}`);
          } catch (dbError) {
            console.error(`[Firestore 업데이트 오류] 사용자ID: ${uid}, 오류:`, dbError);
            // DB 업데이트 실패해도 인증 자체는 성공했으므로 계속 진행
          }
        }
        
        return res.status(200).json({
          success: true,
          message: '이메일 인증이 완료되었습니다.',
          certified_date: response.data.certified_date,
          univName: response.data.univName || '충북대학교'
        });
      } else {
        console.log(`[인증 코드 확인 실패] 이메일: ${email}, 응답:`, response.data);
        return res.status(400).json({
          success: false,
          message: response.data.message || '인증 코드가 일치하지 않습니다.'
        });
      }
    } catch (error) {
      console.error(`[인증 코드 확인 API 에러] 이메일: ${email}, 에러:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return res.status(error.response?.status || 500).json({
        success: false,
        message: error.response?.data?.message || '인증 코드 확인 중 오류가 발생했습니다.'
      });
    }
  } catch (error) {
    console.error('인증 코드 확인 처리 중 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다. 관리자에게 문의해주세요.'
    });
  }
});

// 이메일 인증 상태 확인 API
router.post('/check-status', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log(`[인증 상태 확인 요청] 이메일: ${email}, 시간: ${new Date().toISOString()}`);
    
    if (!email || !isValidChungbukEmail(email)) {
      console.log(`[인증 상태 확인 실패] 잘못된 이메일 형식: ${email}`);
      return res.status(400).json({
        success: false,
        message: '유효한 충북대학교 이메일을 입력해주세요.'
      });
    }
    
    try {
      console.log(`[상태 확인 API 호출] 이메일: ${email}`);
      
      // API 요청 객체 준비
      const requestData = {
        key: process.env.UNIVCERT_API_KEY,
        email: email
      };
      
      // UnivCert API 호출하여 인증 상태 확인
      const response = await axios.post('https://univcert.com/api/v1/status', requestData);
      
      console.log(`[상태 확인 API 응답] 이메일: ${email}, 데이터:`, response.data);
      
      if (response.data.success) {
        console.log(`[인증 상태 확인 성공] 이메일: ${email}, 인증됨, 인증일: ${response.data.certified_date}`);
        return res.status(200).json({
          success: true,
          directVerified: true, // 직접 인증됨 표시
          certified_date: response.data.certified_date,
          message: '인증된 이메일입니다.'
        });
      } else {
        console.log(`[인증 상태 확인] 이메일: ${email}, 인증되지 않음`);
        return res.status(400).json({
          success: false,
          message: '인증되지 않은 이메일입니다.'
        });
      }
    } catch (error) {
      console.error(`[상태 확인 API 에러] 이메일: ${email}, 에러:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // UnivCert API는 인증되지 않은 이메일을 400 에러로 반환
      if (error.response?.status === 400) {
        console.log(`[인증 상태 확인] 이메일: ${email}, 인증되지 않음 (에러 응답)`);
        return res.status(200).json({
          success: false,
          verified: false,
          message: '인증되지 않은 이메일입니다.'
        });
      }
      
      console.error(`[서버 오류] 이메일 인증 상태 확인 중 예상치 못한 오류 발생, 이메일: ${email}`);
      return res.status(500).json({
        success: false,
        message: error.response?.data?.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
  } catch (error) {
    console.error('인증 상태 확인 처리 중 서버 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다. 관리자에게 문의해주세요.'
    });
  }
});

module.exports = router;