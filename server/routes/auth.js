const express = require('express');
const router = express.Router();
const axios = require('axios');
const { admin, firestore } = require('../config/firebase');

//충북대 이메일인지 확인하는거... 간단함
function checkChungbukEmail(email) {
  if (!email) return false;
  return email.includes('@chungbuk.ac.kr');
}

//이메일 인증하는 API
router.post('/verify-email', async (req, res) => {
  try {
    const { email, univName, univ_check } = req.body;
    
    //이메일 체크부터
    if (!email || !checkChungbukEmail(email)) {
      res.status(400).json({ 
        success: false, 
        message: '충북대 이메일만 가능합니다' 
      });
      return;
    }
    
    //API 요청 날리기
    try {
      const data = {
        key: process.env.UNIVCERT_API_KEY,
        email: email,
        univName: univName ? univName : '충북대학교',
        univ_check: univ_check || true
      };
      
      const response = await axios.post('https://univcert.com/api/v1/certify', data);
      
      if (response.data.success) {
        res.json({
          success: true,
          directVerified: true,
          message: '인증 성공',
          certified_date: new Date().toISOString()
        });
      } else {
        res.status(400).json({
          success: false,
          message: response.data.message || '인증 실패'
        });
      }
    } catch (error) {
      //이미 인증된 경우
      if (error.response && error.response.data && error.response.data.message === '이미 완료된 요청입니다.') {
        res.json({
          success: true,
          directVerified: true,
          message: '이미 인증됨',
          certified_date: new Date().toISOString()
        });
        return;
      }
      
      //400 에러
      if (error.response?.status === 400) {
        res.status(400).json({
          success: false,
          message: error.response.data?.message || '인증 오류'
        });
        return;
      }
      
      //나머지 에러
      console.log('인증 에러:', error);
      res.status(500).json({
        success: false,
        message: '서버 오류'
      });
    }
  } catch (error) {
    console.error('전체 에러:', error);
    res.status(500).json({
      success: false,
      message: '서버 오륙'
    });
  }
});

//상태 확인
router.post('/check-status', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !checkChungbukEmail(email)) {
      res.status(400).json({
        success: false,
        message: '이메일 형식 오류'
      });
      return;
    }
    
    try {
      const statusResponse = await axios.post('https://univcert.com/api/v1/status', {
        key: process.env.UNIVCERT_API_KEY,
        email: email
      });
      
      if (statusResponse.data.success) {
        res.json({
          success: true,
          directVerified: true,
          certified_date: statusResponse.data.certified_date,
          message: '인증됨'
        });
      } else {
        res.status(400).json({
          success: false,
          message: '인증 안됨'
        });
      }
    } catch (error) {
      if (error.response?.status === 400) {
        res.json({
          success: false,
          verified: false,
          message: '인증 안됨'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '에러 발생'
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '서버 에러'
    });
  }
});

//토큰 검증 미들웨어
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    //Authorization 헤더 체크
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '토큰 없음'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', ''); //substring 대신 replace 사용
    const decoded = await admin.auth().verifyIdToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.log('토큰 에러:', error.message);
    res.status(401).json({
      success: false,
      message: '잘못된 토큰'
    });
  }
};

//회원가입
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    //데이터 추출
    let email, displayName;
    if (req.body) {
      email = req.body.email;
      displayName = req.body.displayName;
    }
    
    //몸체에 데이터 없으면 유저에서 가져오기
    if (!email) {
      email = req.user.email;
      displayName = req.user.name || req.user.displayName || '';
    }
    
    const uid = req.user.uid;

    //이미 있는 유저인지 체크
    const existingUser = await firestore.collection('users').doc(uid).get();
    
    if (existingUser.exists) {
      res.json({
        success: true,
        message: '이미 가입됨',
        user: existingUser.data()
      });
      return;
    }

    //이메일 체크
    if (!checkChungbukEmail(email)) {
      res.status(400).json({
        success: false,
        message: '충북대 이메일만 가능'
      });
      return;
    }

    //새 유저 데이터 만들기
    const now = new Date().toISOString();
    const newUser = {
      uid: uid,
      email: email,
      displayName: displayName || '',
      department: '',
      interests: [],
      groups: [],
      certified_email: false,
      certified_date: null,
      createdAt: now,
      lastLoginAt: now
    };
    
    //DB에 저장
    await firestore.collection('users').doc(uid).set(newUser);

    res.status(201).json({
      success: true,
      message: '가입 완료',
      user: newUser
    });

  } catch (error) {
    console.error('가입 에러:', error);
    res.status(500).json({
      success: false,
      message: '가입 실패'
    });
  }
});

//로그인
router.post('/login', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await firestore.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        message: '사용자 없음'
      });
      return;
    }

    const userData = userDoc.data();
    const now = new Date().toISOString();
    
    //마지막 로그인 시간 업데이트
    await firestore.collection('users').doc(uid).update({
      lastLoginAt: now
    });

    res.json({
      success: true,
      message: '로그인 OK',
      user: {
        ...userData,
        lastLoginAt: now
      }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({
      success: false,
      message: '로그인 실패'
    });
  }
});

//프로필 가져오기
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const profileDoc = await firestore.collection('users').doc(req.user.uid).get();
    
    if (!profileDoc.exists) {
      res.status(404).json({
        success: false,
        message: '프로필 없음'
      });
      return;
    }

    res.json({
      success: true,
      user: profileDoc.data()
    });
  } catch (error) {
    console.error('프로필 에러:', error);
    res.status(500).json({
      success: false,
      message: '프로필 에러'
    });
  }
});

//프로필 업데이트
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const updateData = req.body;
    const okFields = ['displayName', 'department', 'interests']; //허용된 필드들
    const newData = {};
    
    //허용된 필드만 필터링
    for (let i = 0; i < okFields.length; i++) {
      const field = okFields[i];
      if (updateData[field] !== undefined) {
        newData[field] = updateData[field];
      }
    }

    //업데이트할 데이터 없으면
    if (Object.keys(newData).length === 0) {
      res.status(400).json({
        success: false,
        message: '업데이트할 데이터 없음'
      });
      return;
    }

    newData.updatedAt = new Date().toISOString();
    await firestore.collection('users').doc(req.user.uid).update(newData);

    res.json({
      success: true,
      message: '업데이트 OK'
    });
  } catch (error) {
    console.error('업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '업데이트 실패'
    });
  }
});

//로그아웃
router.post('/logout', verifyFirebaseToken, async (req, res) => {
  try {
    //리프레시 토큰 취소
    await admin.auth().revokeRefreshTokens(req.user.uid);
    res.json({ success: true, message: '로그아웃 OK' });
  } catch (error) {
    console.log('로그아웃 에러:', error);
    res.status(500).json({ success: false, message: '로그아웃 실패' });
  }
});

//이메일 인증 상태 업데이트
router.post('/update-email-certification', verifyFirebaseToken, async (req, res) => {
  try {
    const email = req.user.email;
    let certData = { certified_email: false, certified_date: null };
    
    //인증 상태 확인
    try {
      const statusCheck = await axios.post('https://univcert.com/api/v1/status', {
        key: process.env.UNIVCERT_API_KEY,
        email: email
      });
      
      if (statusCheck.data.success) {
        certData = {
          certified_email: true,
          certified_date: statusCheck.data.certified_date || new Date().toISOString()
        };
      }
    } catch (checkError) {
      res.status(400).json({
        success: false,
        message: '인증 상태 확인 실패'
      });
      return;
    }

    //DB 업데이트
    await firestore.collection('users').doc(req.user.uid).update({
      ...certData,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: '인증 상태 업데이트 OK',
      ...certData
    });
  } catch (error) {
    console.error('인증 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '업데이트 실패'
    });
  }
});

module.exports = router;