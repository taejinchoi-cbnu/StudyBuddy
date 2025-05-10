**한국어** | [English](README.en.md)

# StudyBuddy
![웹 아이콘](client/src/assets/logoHome.png)

StudyBuddy는 학생들이 스터디 그룹을 쉽게 만들고 참여하며, 일정을 조율하고 실시간으로 소통할 수 있는 웹 애플리케이션입니다.
스터디 그룹 뿐만 아니라 팀을 구성하여 공모전, 졸업 과제 등 그룹이 필요한 모든 분야에서 사용 가능합니다.

## 0. 프로젝트 제작 동기

학업과 프로젝트에서 적합한 팀원을 찾는 것은 항상 어려운 과제입니다. 공모전, 알고리즘 스터디, 해커톤, 개인 프로젝트 등을 진행하면서 다음과 같은 문제점을 경험했습니다:

1. **적합한 팀원 찾기 어려움**: 특정 분야나 포지션의 필요한 팀원을 지인 네트워크에서 찾기 힘듦
2. **지역적 한계**: 기존 플랫폼은 지역에 관계없이 매칭이 가능한 장점이 있지만 동시에 오프라인 협업 시 불편함 발생
3. **신뢰성 부족**: 에브리타임 등의 익명 플랫폼에서는 팀원의 실력에 대한 신뢰성 검증이 어려움

이러한 문제점을 해결하기 위해 기존 서비스의 단점을 보완하고 장점을 강화한 새로운 팀 매칭 플랫폼을 개발하게 되었습니다.

## 1. Your idea

- 신뢰성 있는 온라인 커뮤니티
    - **대학 이메일 인증**: 충북대학교 이메일(@chungbuk.ac.kr)로만 가입 가능
    - 협업 후 상호 평가를 통한 신뢰도 지표 구축
- 유연한 팀 매칭 시스템
    - **양방향 매칭**: 팀을 생성하여 멤버 모집 또는 개인 프로필 등록으로 제안(offer) 받기 가능
    - **지능형 추천 알고리즘**: 관심사, 학습 스타일, 목표 등을 고려한 맞춤형 추천
- 효율적인 일정 관리
    - **가용 시간 입력**: 각 멤버의 가능한 시간 입력 인터페이스
    - **최적 시간 자동 계산**: 모든 멤버의 공통 가능 시간 자동 도출
    - **시각적 일정표**: 캘린더 형태로 그룹 일정 시각화
- 협업 도구 제공
    - **그룹 채팅**: 웹 내부에서 실시간 소통 가능
        - **마크다운 지원**: 개발자 친화적 환경
- 프로젝트 진행 관리
    - **마일스톤 설정**: 단계별 목표 설정 및 관리
    - **진행률 시각화**: 간트 차트 제공
        - 각 미팅별 간단한 메모 기능 제공

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
  - 다크모드 지원
  - 통일된 로딩 인터페이스 (useLoading 훅 적용)

### 현재 구현된 기능 (2주차)
- **그룹 생성**
- **그룹 검색 페이지**
- **그룹 참가 요청**
- **그룹 관리자의 요청 승인/거절, 그룹 삭제 기능**
  
### 개발 예정 기능
- **스케줄 매칭**: 구성원 간 공통으로 가능 시간 찾기
- **실시간 그룹 채팅**: 텍스트 기반 메시지 교환
- **일정 확인**: 구글 캘린더와 연동하여 스터디 일정을 보다 효율적으로 관리

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

## 주요 기능 설명

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

### 2. 다크모드
DarkModeContext를 통해 애플리케이션 전체에서 다크모드를 지원합니다.

```javascript
const { darkMode, toggleDarkMode } = useDarkMode();
```

### 3. 통일된 네비게이션
AppNavbar 컴포넌트를 통해 모든 페이지에서 일관된 네비게이션 UI를 제공합니다.

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/my-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 원격 브랜치에 푸시합니다: `git push origin feature/my-feature`
5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
