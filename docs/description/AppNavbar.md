# AppNavbar 컴포넌트 상세 분석

## 개요
AppNavbar는 StudyBuddy 애플리케이션의 핵심 네비게이션 컴포넌트로, 사용자 인증, 다크모드, 그리고 전체 애플리케이션 네비게이션을 담당합니다.

## 사용된 주요 기술들

### 1. React 기술 스택
- **React Hooks**: `useState`, `useEffect`, `forwardRef`, `useImperativeHandle`
- **React Context API**: 전역 상태 관리
- **React Router**: 클라이언트 사이드 라우팅

### 2. UI 라이브러리
- **React Bootstrap**: UI 컴포넌트 (`Navbar`, `Nav`, `Modal`, `Button`, `Form`, `Alert`, `Spinner`)
- **Bootstrap Icons**: 아이콘 표시

### 3. Firebase 인증
- **Firebase Authentication**: 사용자 로그인/회원가입/로그아웃
- **Firestore**: 사용자 프로필 데이터 저장

## 컴포넌트 구조 및 기능

### 1. 컨텍스트 사용 (Context Usage)

#### AuthContext 사용
```javascript
const { 
  currentUser,      // 현재 로그인된 사용자
  logout,           // 로그아웃 함수
  login,            // 로그인 함수
  signup,           // 회원가입 함수
  resetPassword,    // 비밀번호 재설정 함수
  authLoading       // 인증 로딩 상태
} = useAuth();
```

#### DarkModeContext 사용
```javascript
const { darkMode, toggleDarkMode } = useDarkMode();
```

### 2. 다른 페이지에서 Navbar 기능 사용하는 방법

#### forwardRef와 useImperativeHandle을 통한 외부 접근
```javascript
const AppNavbar = forwardRef((props, ref) => {
  // ref를 통해 외부에서 접근 가능한 메서드 노출
  useImperativeHandle(ref, () => ({
    handleLoginModalOpen,
    handleSignupModalOpen,
    handleForgotPasswordModalOpen
  }));
});
```

#### 다른 컴포넌트에서 사용 예시
```javascript
// 다른 페이지에서 사용
import { useRef } from 'react';

function SomePage() {
  const navbarRef = useRef();
  
  const openLoginModal = () => {
    navbarRef.current?.handleLoginModalOpen();
  };
  
  return (
    <div>
      <AppNavbar ref={navbarRef} />
      <button onClick={openLoginModal}>로그인</button>
    </div>
  );
}
```

### 3. 로그인/회원가입/로그아웃 처리 과정

#### 로그인 프로세스 (`handleLogin`)
1. **사용자 입력 검증**: 이메일, 비밀번호 확인
2. **Firebase 인증**: `login(email, password)` 호출
3. **성공 시**: 
   - 모달 닫기
   - 대시보드 페이지로 리다이렉트 (`navigate("/dashboard")`)
4. **실패 시**: 에러 메시지 표시

#### 회원가입 프로세스 (`handleSignup`)
1. **입력 유효성 검증**:
   - 비밀번호 일치 확인
   - 비밀번호 최소 6자 확인
   - 충북대학교 이메일(@chungbuk.ac.kr) 확인
2. **계정 생성**: `signup()` 함수 호출
3. **성공 시**: 프로필 페이지로 리다이렉트

#### 로그아웃 프로세스 (`handleLogout`)
1. **로그아웃 실행**: `logout()` 함수 호출
2. **홈페이지로 리다이렉트**: `navigate("/")`

### 4. 비밀번호 재설정 처리
1. **이메일 입력 받기**
2. **Firebase `resetPassword()` 호출**
3. **성공 시**: 안내 메시지 표시 후 로그인 모달로 전환

### 5. 모달 상태 관리

#### 모달 상태
```javascript
const [showLoginModal, setShowLoginModal] = useState(false);
const [showSignupModal, setShowSignupModal] = useState(false);
const [showForgotModal, setShowForgotModal] = useState(false);
```

#### 모달 제어 함수들
- `openModal(type)`: 특정 모달 열기
- `closeModal(type)`: 특정 모달 닫기
- `switchModal(from, to)`: 모달 간 전환
- `isOpen(type)`: 모달 열림 상태 확인

## 다크모드 구현 방식

### 1. DarkModeContext 구조

#### Context Provider (`DarkModeProvider`)
```javascript
// 로컬 스토리지에서 이전 상태 로드
const [darkMode, setDarkMode] = useState(() => {
  try {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  } catch (error) {
    return false; // 오류 시 기본값
  }
});
```

#### 다크모드 토글 함수
```javascript
const toggleDarkMode = () => {
  setDarkMode(prevMode => !prevMode);
};
```

### 2. 다크모드 적용 방식

#### CSS 클래스 기반 테마 적용
```javascript
useEffect(() => {
  // 로컬 스토리지에 상태 저장
  localStorage.setItem('darkMode', JSON.stringify(darkMode));
  
  // 부드러운 테마 전환을 위한 애니메이션 클래스
  document.body.classList.add('theme-transition');
  
  // body에 dark-mode 클래스 추가/제거
  if (darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}, [darkMode]);
```

#### UI 컴포넌트에 다크모드 적용
```javascript
// Navbar variant 동적 설정
<Navbar 
  variant={darkMode ? "dark" : "light"} 
  className={`dashboard-navbar ${darkMode ? "dark-mode" : ""}`}
>

// 버튼 스타일 동적 설정
<Button 
  variant={darkMode ? "outline-light" : "outline-dark"}
>

// 모달에 다크모드 클래스 적용
<Modal 
  className={`auth-modal ${darkMode ? "dark-mode" : ""}`}
>
```

### 3. 다크모드 토글 UI
```javascript
<Form.Check 
  type="switch"
  id="dark-mode-switch"
  checked={darkMode}
  onChange={toggleDarkMode}
  className="dark-mode-toggle"
  label={darkMode ? "🌙" : "☀️"}  // 아이콘으로 상태 표시
/>
```

## 알림 시스템 (Notification System)

### useNotification 훅 사용
```javascript
const { 
  error,      // 에러 메시지
  success,    // 성공 메시지
  info,       // 정보 메시지
  showError,  // 에러 표시 함수
  showSuccess,// 성공 표시 함수
  showInfo,   // 정보 표시 함수
  clearAll    // 모든 알림 지우기
} = useNotification();
```

### 알림 표시 방식
```javascript
// 모달 내부에서 알림 표시
{error && <Alert variant="danger">{error}</Alert>}
{success && <Alert variant="success">{success}</Alert>}
{info && <Alert variant="info">{info}</Alert>}
```

## 로딩 상태 관리

### LoadingSpinner 컴포넌트 사용
```javascript
{(authLoading.login || isProcessing || authLoading.resetPassword) && 
  <LoadingSpinner />
}
```

### 버튼 로딩 상태
```javascript
<Button 
  disabled={authLoading.login}
>
  {authLoading.login ? "로그인 중..." : "로그인"}
</Button>
```

## 네비게이션 구조

### 인증된 사용자용 네비게이션
```javascript
{currentUser && (
  <>
    <Nav.Link as={Link} to="/dashboard">대시보드</Nav.Link>
    <Nav.Link as={Link} to="/groups">그룹</Nav.Link>
    <Nav.Link as={Link} to="/schedule">일정</Nav.Link>
  </>
)}
```

### 인증 상태에 따른 버튼 표시
```javascript
{currentUser ? (
  // 로그인된 상태: 프로필, 로그아웃 버튼
  <>
    <Nav.Link as={Link} to="/profile">프로필</Nav.Link>
    <Button onClick={handleLogout}>로그아웃</Button>
  </>
) : (
  // 비로그인 상태: 로그인, 회원가입 버튼
  <>
    <Button onClick={handleLoginModalOpen}>로그인</Button>
    <Button onClick={handleSignupModalOpen}>회원가입</Button>
  </>
)}
```

## 주요 특징 및 장점

### 1. 재사용성
- `forwardRef`와 `useImperativeHandle`을 통해 다른 컴포넌트에서 모달 제어 가능
- Context API로 전역 상태 공유

### 2. 사용자 경험 (UX)
- 부드러운 다크모드 전환 애니메이션
- 로딩 상태 표시로 사용자 피드백 제공
- 모달 간 원활한 전환

### 3. 보안
- 이메일 도메인 검증 (@chungbuk.ac.kr)
- 비밀번호 복잡성 검증
- Firebase 보안 규칙 적용

### 4. 반응형 디자인
- Bootstrap의 반응형 Navbar 컴포넌트 활용
- 모바일 토글 메뉴 지원