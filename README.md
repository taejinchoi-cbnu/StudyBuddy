**한국어** | [English](README.en.md)

# StudyBuddy 🎓✨
<div align="center">
  <img src="client/src/assets/logoHome.png" width="250"/><br>
  <p><strong>StudyBuddy는 학생들이 효율적으로 스터디 그룹을 형성하고 관리할 수 있도록 도와주는 웹 애플리케이션입니다.</strong></p>
</div>


## 📝 프로젝트 소개

오픈소스웹소프트웨어 Final Project [25-1]

StudyBuddy는 React와 Firebase를 기반으로 한 모던 웹 애플리케이션으로, 학생들이 스터디 그룹을 쉽게 만들고 참여할 수 있도록 설계되었습니다. 직관적인 UI/UX와 실시간 데이터 동기화를 통해 효율적인 협업 환경을 제공합니다.

## 📽️ 데모 및 결과물

[여기에 데모 영상이나 스크린샷이 추가하기]
<div align="cneter">
  <video controls src="docs/Videos/WelcomePage.mp4" width="300" muted autoplay ></video>
</div>

## ✨ 주요 기능

- **🏠 대시보드**: 개인화된 대시보드로 활동 현황 한눈에 파악
- **👥 그룹 관리**: 스터디 그룹 생성, 참여 및 관리
- **📅 일정 관리**: 그룹별 일정 조율 및 캘린더 기능
- **🔔 알림 시스템**: 실시간 그룹 요청 및 일정 알림
- **👤 프로필 관리**: 개인 프로필 및 설정 관리
- **🌙 다크 모드**: 사용자 편의성을 위한 테마 변경 기능

## 🛠️ 기술 스택

### Frontend
- **React 18** - 모던 리액트 기반 사용자 인터페이스
- **Vite** - 빠른 개발 환경 및 빌드 도구
- **CSS3** - 반응형 디자인 및 스타일링
- **React Router** - 클라이언트 사이드 라우팅

### Backend & Database
- **Node.js** - 서버사이드 런타임
- **Express.js** - 웹 애플리케이션 프레임워크
- **Firebase** - 실시간 데이터베이스 및 인증

### Development Tools
- **ESLint** - 코드 품질 관리
- **Git** - 버전 관리

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 16.0.0 이상
- npm 또는 yarn

### 설치 방법

1. **저장소 클론**
```bash
git clone https://github.com/yourusername/StudyBuddy.git
cd StudyBuddy
```

2. **의존성 설치**
```bash
# 루트 디렉토리에서
npm install

# 클라이언트 의존성 설치
cd client
npm install

# 서버 의존성 설치
cd ../server
npm install
```

3. **환경 변수 설정**
```bash
# client/.env 파일 생성
cp client/.env.example client/.env

# server/.env 파일 생성
cp server/.env.example server/.env
```

4. **Firebase 설정**
- Firebase 프로젝트 생성
- 프로젝트 설정에서 웹 앱 구성 정보 복사
- `client/src/firebase.js`와 `server/config/firebase.js`에 설정 정보 입력

5. **애플리케이션 실행**
```bash
# 서버 실행 (server 디렉토리에서)
npm start

# 클라이언트 실행 (client 디렉토리에서)
npm run dev
```

## 📁 프로젝트 구조

```
StudyBuddy/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── contexts/      # React Context
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── utils/         # 유틸리티 함수
│   │   └── styles/        # CSS 스타일
│   └── public/            # 정적 파일
├── server/                # Node.js 백엔드
│   ├── config/           # 설정 파일
│   ├── routes/           # API 라우트
│   └── server.js         # 서버 진입점
└── README.md
```

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE.md](LICENSE.md) 파일을 확인하세요.

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 언제든지 연락주세요.
(xowls000@chungbuk.ac.kr)
