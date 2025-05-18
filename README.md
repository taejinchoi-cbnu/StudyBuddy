<img width="677" alt="image" src="https://github.com/user-attachments/assets/f7ee32f2-1ae3-47ce-9dce-5329dec6bb5e" />**한국어** | [English](README.en.md)

# StudyBuddy 🎓✨
![웹 아이콘](client/src/assets/logoHome.png)

StudyBuddy는 학생들이 스터디 그룹을 쉽게 만들고 참여하며, 일정을 조율할 수 있는 애플리케이션입니다. 📚
스터디 그룹 뿐만 아니라 팀을 구성하여 공모전, 졸업 과제 등 그룹이 필요한 모든 분야에서 사용 가능합니다! 🤝

## 0. 프로젝트 제작 동기 💡

학업과 프로젝트에서 적합한 팀원을 찾는 것은 항상 어려운 과제입니다. 공모전, 알고리즘 스터디, 해커톤, 개인 프로젝트 등을 진행하면서 다음과 같은 문제점을 경험했습니다:

1. **적합한 팀원 찾기 어려움**: 🔍 특정 분야나 포지션의 필요한 팀원을 지인 네트워크에서 찾기 힘듦
2. **지역적 한계**: 🗺️ 기존 플랫폼은 지역에 관계없이 매칭이 가능한 장점이 있지만 동시에 오프라인 협업 시 불편함 발생
3. **신뢰성 부족**: 🤔 에브리타임 등의 익명 플랫폼에서는 팀원의 실력에 대한 신뢰성 검증이 어려움
4. **일정 조율의 복잡함**: ⏰ 여러 명의 일정을 맞추기 위해 개별적으로 가능한 시간을 물어보고 조율하는 과정이 비효율적

이러한 문제점을 해결하기 위해 기존 서비스의 단점을 보완하고 장점을 강화한 새로운 팀 매칭 플랫폼을 개발하게 되었습니다.

## 1. Your idea 💭

- 신뢰성 있는 온라인 커뮤니티
    - **대학 이메일 인증**: ✅ 충북대학교 이메일(@chungbuk.ac.kr)로만 가입 가능
- 유연한 팀 매칭 시스템
    - **양방향 매칭**: 🔄 팀을 생성하여 멤버 모집 또는 개인 프로필 등록으로 제안(offer) 받기 가능
- 효율적인 일정 관리
    - **가용 시간 입력**: 📝 각 멤버의 가능한 시간 입력 인터페이스
    - **최적 시간 자동 계산**: 🧮 모든 멤버의 공통 가능 시간 자동 도출
    - **시각적 일정표**: 📅 캘린더 형태로 그룹 일정 시각화
- 프로젝트 진행 관리
    - **진행률 시각화**: 📊 간트 차트 제공

## 기능 ✨

### 현재 구현된 기능
- **사용자 인증**
  - 📝 회원가입 (이메일/비밀번호)
  - 🔑 로그인/로그아웃
- **사용자 프로필 관리**
  - 👤 기본 정보 설정 (이름, 학과, 관심 분야)
  - 📋 사용자 정보 표시 및 수정
- **UI/UX**
  - 📱 반응형 디자인 (모바일, 태블릿, 데스크톱)
  - 🖼️ 모달 인증 폼
  - 🇰🇷 한글 폰트 적용 및 일관된 디자인
  - 🌓 다크모드 지원
  - 🔄 통일된 로딩 인터페이스 (useLoading 훅 적용)

- **그룹 생성** 👥
- **그룹 검색 페이지** 🔍
- **그룹 참가 요청** 📨
- **그룹 관리자의 요청 승인/거절, 그룹 삭제 기능** 👑

- **스케줄 조정 기능** ⏰
  - 각 멤버별 불가능한 시간 입력
  - 모든 멤버가 참여 가능한 시간 자동 계산
  - 관리자용 시간 제출 현황 확인
  - 그룹 멤버만 접근 가능한 권한 관리
  
### 개발 예정 기능
- **일정 확인**: 📅 구글 캘린더와 연동하여 스터디 일정을 보다 효율적으로 관리
- **DashBoard**: 📊 사용자의 홈 화면에서 모임 시간 등을 간트 차트로 보여주고, 시계, 참여중인 그룹 등을 제공

## 기술 스택 🛠️

- **프론트엔드**: Vite + React, HTML+CSS, Bootstrap, React Router
- **백엔드**: Node.js, Express, Axios
- **데이터베이스**: Firebase (Authentication, Firestore)
- **기타**: Git, GitHub

## 설치 및 실행 방법 🚀

1. 저장소를 클론합니다.
```bash
git clone https://github.com/taejinchoi-cbnu/StudyBuddy.git
cd StudyBuddy
```
2. 환경 변수를 설정합니다.

**클라이언트 측**
```bash
cd client
cp .env.example .env
```
`.env` 파일에 Firebase 구성 정보를 입력합니다:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**서버측**
```bash
cd ../server
cp .env.example .env
```

3. 의존성을 설치합니다.
**클라이언트 측**
```bash
cd client
npm install
```
**서버 측**
```bash
cd ../server
npm install
```

4. 애플리케이션을 실행합니다.

**클라이언트 측 (새 터미널에서)**
```bash
cd client
npm run dev
```

**서버 측 (새 터미널에서)**
```bash
cd server
npm run dev
```

5. 브라우저에서 http://localhost:5173에 접속합니다.

## 주요 기능 설명 🔑

### 1. 커스텀 훅 UseLoading
비동기 작업의 로딩 상태를 일관되게 관리하는 커스텀 훅입니다.
```jsx
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
```jsx
const { darkMode, toggleDarkMode } = useDarkMode();
```

### 3. 스케줄 조정 기능
그룹 멤버들의 가능한 시간을 효율적으로 찾아주는 기능입니다.
```jsx
// client\src\components\schedule\UnavailabilitySelector.jsx

// 불가능한 시간 추가
const addUnavailableTime = (userId, day, startTime, endTime) => {
  // 시간 추가 로직
};

// 모두가 가능한 시간 계산
const calculateAvailableTimes = () => {
  // 시간 계산 알고리즘
};
```

## 기여 방법 🤝
1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/my-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 원격 브랜치에 푸시합니다: `git push origin feature/my-feature`
5. Pull Request를 생성합니다.

## 라이선스 📜
이 프로젝트는 MIT 라이선스 하에 배포됩니다.