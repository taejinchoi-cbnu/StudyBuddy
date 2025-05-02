# StudyBuddy

StudyBuddy는 학생들이 스터디 그룹을 쉽게 만들고 참여하며, 일정을 조율하고 실시간으로 소통할 수 있는 웹 애플리케이션입니다.

## 기능

### 현재 구현된 기능 (1주차)
- **사용자 인증**
  - 회원가입 (이메일/비밀번호)
  - 로그인/로그아웃
  - 비밀번호 재설정
- **사용자 프로필 관리**
  - 기본 정보 설정 (이름, 학과, 관심 분야)
  - 사용자 정보 표시 및 수정
- **UI/UX**
  - 반응형 디자인 (모바일, 태블릿, 데스크톱)
  - 모달 인증 폼
  - 한글 폰트 적용 및 일관된 디자인

### 개발 예정 기능
- **스터디 그룹 관리**: 생성, 검색, 참여 요청, 승인/거절
- **스케줄 매칭**: 구성원 간 공통 가능 시간 찾기
- **실시간 그룹 채팅**: 텍스트 기반 메시지 교환

## 기술 스택

- **프론트엔드**: Vite + React, Bootstrap, React Router
- **백엔드**: Node.js, Express, Axios
- **데이터베이스**: Firebase (Authentication, Firestore)
- **기타**: Git, GitHub

## 설치 및 실행 방법

1. 저장소를 클론합니다.
```bash
git clone https://github.com/taejinchoi-cbnu/StudyBuddy.git
cd StudyBuddy
```

2. 환경 변수를 설정합니다.

   클라이언트 측
   ```bash
   cd client
   cp .env.example .env
   ```
   `.env` 파일에 Firebase 구성 정보를 입력합니다:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   서버 측
   ```bash
   cd ../server
   cp .env.example .env
   ```

3. 의존성을 설치합니다.

   클라이언트 측
   ```bash
   cd client
   npm install
   ```

   서버 측
   ```bash
   cd ../server
   npm install
   ```

4. 애플리케이션을 실행합니다.

   클라이언트 측 (새 터미널에서)
   ```bash
   cd client
   npm run dev
   ```

   서버 측 (새 터미널에서)
   ```bash
   cd server
   npm run dev
   ```

5. 브라우저에서 [http://localhost:5173](http://localhost:5173)에 접속합니다.

## 프로젝트 구조

```
STUDYBUDDY/
├── client/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── logoHello.png
│   │   │   ├── logoQuestion.png
│   │   │   ├── logoSmall.png
│   │   │   └── logoTextGif.gif
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/ 
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── styles/
│   │   ├── App.jsx
│   │   ├── firebase.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
└── server/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── node_modules/
    ├── routes/
    ├── .env
    ├── package-lock.json
    ├── package.json
    ├── server.js
    ├── .env.example
    ├── .gitignore
    ├── Project Log.md
    └── README.md
```

## 개발 현황

### 1주차 완료
- Firebase Authentication 연동
- 사용자 프로필 Firestore 저장
- 회원가입, 로그인, 로그아웃, 비밀번호 재설정 기능
- 반응형 홈페이지 및 모달 인증 폼
- 보호된 라우트 구현

### 향후 개발 계획
- 2주차: 스터디 그룹 기능 구현
- 3주차: 스케줄 매칭 기능 구현
- 4주차: 실시간 채팅 기능 구현
- 5주차: UI/UX 개선 및 추가 기능
- 6주차: 통합 테스트 및 버그 수정
- 7주차: 오픈 베타 및 최종 발표

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/my-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 원격 브랜치에 푸시합니다: `git push origin feature/my-feature`
5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.