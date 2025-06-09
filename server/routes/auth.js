const express = require('express');
const router = express.Router();
const axios = require('axios');
const { admin, firestore } = require('../config/firebase');

// 기존 도메인 검증 함수
const isValidChungbukEmail = (email) => {
  return email.endsWith('@chungbuk.ac.kr');
};

// 이메일 인증 요청 API - UnivCert API 호출
router.post('/verify-email', async (req, res) => {
  try {
    const { email, univName, univ_check } = req.body;
    
    console.log(`[인증 요청] 이메일: ${email}, 대학: ${univName || '충북대학교'}, 재학확인: ${univ_check ? 'true' : 'false'}, 시간: ${new Date().toISOString()}`);
    
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
        univ_check: univ_check !== undefined ? univ_check : true // 대학 재학 여부까지 확인
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
        // 성공 응답 - 이 시점에서 이메일이 확인됨 (인증 코드 단계 생략)
        console.log(`[인증 성공] 이메일: ${email}, 인증 완료`);
        return res.status(200).json({
          success: true,
          directVerified: true,
          message: '이메일이 성공적으로 확인되었습니다.',
          certified_date: new Date().toISOString()
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
        console.log(`[인증 체크] 이메일: ${email}이 이미 인증된 상태, 성공으로 처리`);
        
        return res.status(200).json({
          success: true,
          directVerified: true,
          message: '이미 인증된 이메일입니다.',
          certified_date: new Date().toISOString()
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

// Firebase 토큰 검증 미들웨어
const verifyFirebaseToken = async (req, res, next) => {
  try {
    console.log('토큰 검증 시작...');
    const authHeader = req.headers.authorization;
    console.log('Authorization 헤더:', authHeader ? authHeader.substring(0, 20) + '...' : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('토큰 헤더가 없거나 잘못된 형식');
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.substring(7);
    console.log('토큰 길이:', token.length);
    console.log('Firebase admin 토큰 검증 시도...');
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('토큰 검증 성공, UID:', decodedToken.uid);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('토큰 검증 오류 상세:', error);
    console.error('토큰 검증 에러 스택:', error.stack);
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
      error: error.message
    });
  }
};

// 회원가입 서버 인증 API
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('[회원가입 서버 인증] 시작');
    console.log('[회원가입 서버 인증] 요청 본문:', req.body);
    console.log('[회원가입 서버 인증] 인증된 사용자 정보:', req.user);

    // req.body가 undefined인 경우 Firebase 토큰에서 정보 추출
    let email, displayName, verified, certifiedDate;
    if (req.body && typeof req.body === 'object') {
      email = req.body.email;
      displayName = req.body.displayName;
      verified = req.body.verified;
      certifiedDate = req.body.certified_date;
    } else {
      console.log('[회원가입 서버 인증] req.body가 undefined, Firebase 토큰에서 정보 추출');
      email = req.user.email;
      displayName = req.user.name || req.user.displayName || '';
      verified = false;
      certifiedDate = null;
    }
    
    const uid = req.user.uid;

    console.log(`[회원가입 서버 인증] UID: ${uid}, 이메일: ${email}, 이름: ${displayName}`);

    // 이미 등록된 사용자인지 확인
    console.log('[회원가입 서버 인증] Firestore에서 기존 사용자 확인 중...');
    const userDoc = await firestore.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      console.log(`[회원가입 서버 인증] 이미 등록된 사용자: ${uid}`);
      return res.status(200).json({
        success: true,
        message: '이미 등록된 사용자입니다.',
        user: userDoc.data()
      });
    }

    console.log('[회원가입 서버 인증] 새 사용자, 계속 진행...');

    // 충북대 이메일 검증
    console.log('[회원가입 서버 인증] 이메일 도메인 검증:', email);
    if (!isValidChungbukEmail(email)) {
      console.log('[회원가입 서버 인증] 잘못된 이메일 도메인');
      return res.status(400).json({
        success: false,
        message: '충북대학교 이메일만 가입 가능합니다.'
      });
    }

    // 회원가입 시 항상 인증되지 않은 상태로 시작
    console.log('[회원가입 서버 인증] 기본 인증 상태 설정 (false)');
    const certificationData = { certified_email: false, certified_date: null };

    // 사용자 정보를 Firestore에 저장
    console.log('[회원가입 서버 인증] Firestore에 사용자 정보 저장 중...');
    const currentTime = new Date().toISOString();
    const userData = {
      uid: uid,
      email: email,
      displayName: displayName || '',
      department: '',
      interests: [],
      groups: [],
      certified_email: certificationData.certified_email,
      certified_date: certificationData.certified_date,
      createdAt: currentTime,
      lastLoginAt: currentTime
    };

    console.log('[회원가입 서버 인증] 저장할 사용자 데이터:', userData);
    
    try {
      await firestore.collection('users').doc(uid).set(userData);
      console.log('[회원가입 서버 인증] Firestore 저장 완료');
    } catch (firestoreError) {
      console.error('[회원가입 서버 인증] Firestore 저장 실패:', firestoreError);
      throw firestoreError;
    }

    console.log(`[회원가입 서버 인증] 사용자 등록 완료: ${uid}`);
    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: userData
    });

  } catch (error) {
    console.error('[회원가입 서버 인증] 오류 상세:', error);
    console.error('[회원가입 서버 인증] 에러 스택:', error.stack);
    console.error('[회원가입 서버 인증] 에러 메시지:', error.message);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 로그인 서버 인증 API
router.post('/login', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;

    console.log(`[로그인 서버 인증] UID: ${uid}, 이메일: ${email}`);

    // Firestore에서 사용자 정보 조회
    const userDoc = await firestore.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log(`[로그인 서버 인증] 등록되지 않은 사용자: ${uid}`);
      return res.status(404).json({
        success: false,
        message: '등록되지 않은 사용자입니다. 회원가입을 먼저 진행해주세요.'
      });
    }

    const userData = userDoc.data();

    // 마지막 로그인 시간 업데이트
    await firestore.collection('users').doc(uid).update({
      lastLoginAt: new Date().toISOString()
    });

    console.log(`[로그인 서버 인증] 로그인 성공: ${uid}`);
    res.status(200).json({
      success: true,
      message: '로그인이 완료되었습니다.',
      user: {
        ...userData,
        lastLoginAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('로그인 서버 인증 오류 상세:', error);
    console.error('로그인 에러 스택:', error.stack);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 사용자 프로필 조회 API
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    console.log(`[프로필 조회] UID: ${uid}`);

    const userDoc = await firestore.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: '사용자 프로필을 찾을 수 없습니다.'
      });
    }

    const userData = userDoc.data();
    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 사용자 프로필 업데이트 API
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const updateData = req.body;

    console.log(`[프로필 업데이트] UID: ${uid}, 데이터:`, updateData);

    // 보안상 중요한 필드는 업데이트에서 제외
    const allowedFields = ['displayName', 'department', 'interests'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '업데이트할 데이터가 없습니다.'
      });
    }

    // 업데이트 시간 추가
    filteredData.updatedAt = new Date().toISOString();

    await firestore.collection('users').doc(uid).update(filteredData);

    console.log(`[프로필 업데이트] 업데이트 완료: ${uid}`);
    res.status(200).json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      updatedFields: Object.keys(filteredData)
    });

  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 로그아웃 API (토큰 무효화)
router.post('/logout', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    console.log(`[로그아웃] UID: ${uid}`);

    // Firebase Admin SDK를 통해 사용자의 모든 토큰 무효화
    await admin.auth().revokeRefreshTokens(uid);

    res.status(200).json({
      success: true,
      message: '로그아웃이 완료되었습니다.'
    });

  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그아웃 중 오류가 발생했습니다.'
    });
  }
});

// 이메일 인증 상태 업데이트 API
router.post('/update-email-certification', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const email = req.user.email;

    console.log(`[이메일 인증 업데이트] UID: ${uid}, 이메일: ${email}`);

    // UnivCert API로 현재 인증 상태 확인
    let certificationData = { certified_email: false, certified_date: null };
    
    try {
      const checkResponse = await axios.post('https://univcert.com/api/v1/status', {
        key: process.env.UNIVCERT_API_KEY,
        email: email
      });
      
      console.log('[이메일 인증 업데이트] UnivCert API 응답:', checkResponse.data);
      
      if (checkResponse.data.success) {
        certificationData = {
          certified_email: true,
          certified_date: checkResponse.data.certified_date || new Date().toISOString()
        };
        console.log('[이메일 인증 업데이트] 인증 성공:', certificationData);
      } else {
        console.log('[이메일 인증 업데이트] 인증되지 않음');
      }
    } catch (verifyError) {
      console.error('[이메일 인증 업데이트] API 호출 실패:', verifyError.response?.data || verifyError.message);
      return res.status(400).json({
        success: false,
        message: '이메일 인증 상태 확인에 실패했습니다.'
      });
    }

    // Firestore에서 사용자 인증 상태 업데이트
    const updateData = {
      certified_email: certificationData.certified_email,
      certified_date: certificationData.certified_date,
      updatedAt: new Date().toISOString()
    };

    await firestore.collection('users').doc(uid).update(updateData);

    console.log(`[이메일 인증 업데이트] 업데이트 완료: ${uid}`, updateData);
    
    res.status(200).json({
      success: true,
      message: '이메일 인증 상태가 업데이트되었습니다.',
      certified_email: certificationData.certified_email,
      certified_date: certificationData.certified_date
    });

  } catch (error) {
    console.error('[이메일 인증 업데이트] 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;