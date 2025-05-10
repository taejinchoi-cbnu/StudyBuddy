const express = require('express');
const router = express.Router();
const axios = require('axios');
const { firestore } = require('../config/firebase');

// 이메일 도메인 검증 헬퍼 함수
const isValidChungbukEmail = (email) => {
  return email.endsWith('@chungbuk.ac.kr');
};

// 이메일 인증 요청 API
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 이메일 형식 검증
    if (!email || !isValidChungbukEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: '유효한 충북대학교 이메일(@chungbuk.ac.kr)을 입력해주세요.' 
      });
    }
    
    // UnivCert API 호출하여 인증 메일 발송
    const response = await axios.post('https://univcert.com/api/v1/certify', {
      key: process.env.UNIVCERT_API_KEY,
      email: email,
      univName: '충북대학교',
      univ_check: false // 이메일 소유자 인증만 수행
    });
    
    if (response.data.success) {
      return res.status(200).json({
        success: true,
        message: '인증 코드가 발송되었습니다. 이메일을 확인해주세요.'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: response.data.message || '인증 코드 발송에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('이메일 인증 요청 오류:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 인증 코드 확인 API
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, uid } = req.body;
    
    // 입력값 검증
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: '이메일과 인증 코드를 모두 입력해주세요.'
      });
    }
    
    // 이메일 형식 검증
    if (!isValidChungbukEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '유효한 충북대학교 이메일이 아닙니다.'
      });
    }
    
    // UnivCert API 호출하여 인증 코드 확인
    const response = await axios.post('https://univcert.com/api/v1/certifycode', {
      key: process.env.UNIVCERT_API_KEY,
      email: email,
      code: parseInt(code)
    });
    
    if (response.data.success) {
      // 유저 ID가 제공된 경우, Firestore에 인증 상태 업데이트
      if (uid) {
        try {
          const userRef = firestore().collection('users').doc(uid);
          await userRef.update({
            certified_email: true,
            certified_date: new Date().toISOString()
          });
        } catch (dbError) {
          console.error('Firestore 업데이트 오류:', dbError);
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
      return res.status(400).json({
        success: false,
        message: response.data.message || '인증 코드가 일치하지 않습니다.'
      });
    }
  } catch (error) {
    console.error('인증 코드 확인 오류:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || '서버 오류가 발생했습니다.'
    });
  }
});

// 이메일 인증 상태 확인 API
router.post('/check-status', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !isValidChungbukEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '유효한 충북대학교 이메일을 입력해주세요.'
      });
    }
    
    // UnivCert API 호출하여 인증 상태 확인
    const response = await axios.post('https://univcert.com/api/v1/status', {
      key: process.env.UNIVCERT_API_KEY,
      email: email
    });
    
    if (response.data.success) {
      return res.status(200).json({
        success: true,
        certified_date: response.data.certified_date,
        message: '인증된 이메일입니다.'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '인증되지 않은 이메일입니다.'
      });
    }
  } catch (error) {
    console.error('인증 상태 확인 오류:', error.response?.data || error.message);
    
    // UnivCert API는 인증되지 않은 이메일을 400 에러로 반환
    if (error.response?.status === 400) {
      return res.status(200).json({
        success: false,
        verified: false,
        message: '인증되지 않은 이메일입니다.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;