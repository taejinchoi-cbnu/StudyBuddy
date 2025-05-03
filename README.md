**한국어** | [English](README.en.md)

# StudyBuddy 📚
![웹 아이콘](client/src/assets/logoHome.png)

StudyBuddy는 학생들이 스터디 그룹을 쉽게 만들고 참여하며, 일정을 조율하고 실시간으로 소통할 수 있는 웹 애플리케이션입니다.
스터디 그룹 뿐만 아니라 팀을 구성하여 공모전, 졸업 과제 등 그룹이 필요한 모든 분야에서 사용 가능합니다.

## ✨ 기능

### 현재 구현된 기능 (1주차)
- **👤 사용자 인증**
  - 회원가입 (이메일/비밀번호)
  - 로그인/로그아웃
  - 비밀번호 재설정
- **⚙️ 사용자 프로필 관리**
  - 기본 정보 설정 (이름, 학과, 관심 분야)
  - 사용자 정보 표시 및 수정
- **🎨 UI/UX**
  - 반응형 디자인 (모바일, 태블릿, 데스크톱)
  - 모달 인증 폼
  - 한글 폰트 적용 및 일관된 디자인
  - 다크모드 지원 🌙
  - 통일된 로딩 인터페이스 (useLoading 훅 적용)

### 개발 예정 기능
- **👥 스터디 그룹 관리**: 생성, 검색, 참여 요청, 승인/거절
- **📅 스케줄 매칭**: 구성원 간 공통으로 가능 시간 찾기
- **💬 실시간 그룹 채팅**: 텍스트 기반 메시지 교환
- **📋 일정 확인**: 구글 캘린더와 연동하여 스터디 일정을 보다 효율적으로 관리

## 🛠️ 기술 스택

- **프론트엔드**: Vite + React, Bootstrap, React Router
- **백엔드**: Node.js, Express, Axios
- **데이터베이스**: Firebase (Authentication, Firestore)
- **기타**: Git, GitHub

## 🚀 설치 및 실행 방법

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

## 📁 프로젝트 구조

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
│   │   │   ├── logoBook.png
│   │   │   └── logoTextGif.gif
│   │   ├── components/
│   │   │   ├── AppNavbar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/ 
│   │   │   ├── AuthContext.jsx
│   │   │   └── DarkModeContext.jsx
│   │   ├── hooks/
│   │   │   └── useLoading.js
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── styles/
│   │   │   ├── DashboardStyles.css
│   │   │   ├── LoadingSpinner.css
│   │   │   └── MainStyles.css
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

## 📊 개발 현황

### 1주차 완료 ✅
- Firebase Authentication 연동
- 사용자 프로필 Firestore 저장
- 회원가입, 로그인, 로그아웃, 비밀번호 재설정 기능
- 반응형 홈페이지 및 모달 인증 폼
- 보호된 라우트 구현
- 다크모드 구현
- useLoading 커스텀 훅 적용
- 통일된 로딩 인터페이스

### 향후 개발 계획 📆
- 2주차: 스터디 그룹 기능 구현 (5/5 ~ 5/11)
- 3주차: 스케줄 매칭 기능 구현 (5/12 ~ 5/18)
- 4주차: 실시간 채팅 기능 구현 (5/19 ~ 5/25)
- 5주차: UI/UX 개선 및 추가 기능 (5/26 ~ 6/1)
- 6주차: 통합 테스트 및 버그 수정 (6/2 ~ 6/8)
- 7주차: 기말 과제 발표 준비 및 최종 검토 (6/9 ~ 6/20)

## 💡 주요 기능 설명

### 1. 커스텀 훅 useLoading
비동기 작업의 로딩 상태를 일관되게 관리하는 커스텀 훅입니다.

> **참고**: 이 훅은 [Toss Slash 라이브러리의 useLoading](https://www.slash.page/ko/libraries/react/use-loading/src/useLoading.i18n)을 참고하여 구현했습니다.

```javascript
const [isLoading, startLoading] = useLoading();

// 사용 예시
const handleOperation = async () => {
  try {
    const result = await startLoading(someAsyncOperation());
    // 성공 처리
  } catch (error) {
    // 에러 처리
  }
};
```

### 2. 다크모드 🌙
DarkModeContext를 통해 애플리케이션 전체에서 다크모드를 지원합니다.

```javascript
const { darkMode, toggleDarkMode } = useDarkMode();
```

### 3. 통일된 네비게이션 🧭
AppNavbar 컴포넌트를 통해 모든 페이지에서 일관된 네비게이션 UI를 제공합니다.

## 🤝 기여 방법

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/my-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 원격 브랜치에 푸시합니다: `git push origin feature/my-feature`
5. Pull Request를 생성합니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
