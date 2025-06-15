# StudyBuddy 프로젝트 최종 발표 스크립트

---

## 1. 프로젝트 소개 및 아이디어

### 개요
안녕하십니까. 저희는 TEAM Dynamic duo 입니다. 최종 발표 시작하겠습니다.
StudyBuddy 학생들이 효율적으로 스터디 그룹을 형성하고 관리할 수 있도록 도와주는 웹 애플리케이션입니다.

### 프로젝트 아이디어 선택 배경
중간 발표에서도 말씀드린 바와 같이 저희가 이 주제를 선정한 이유는 크게 두가지 입니다.

- **팀원 찾기의 어려움**: 같은 목표를 가진 스터디 파트너를 찾기 어려움
- **일정 조율의 복잡성**: 여러 사람의 스케줄을 맞추는 것이 번거로움

저희는 이 중 일정 조율의 복잡성을 개선하고자 그룹 내에서 멤버들이 불가능한 시간을 각자 입력하면
모두가 가능한 시간을 출력해주는 기능 구현에 초점을 맞췄습니다.

---

## 2. 요구사항 분석

### 기능적 요구사항
1. **사용자 인증 시스템**: 이메일 인증을 통한 안전한 회원가입 및 로그인
2. **그룹 생성/관리**: 주제별, 목적별 스터디 그룹 생성 및 설정 관리
3. **그룹 검색/가입**: 관심사 기반 그룹 검색 및 가입 요청 시스템
4. **멤버 관리**: 그룹 관리자의 멤버 승인/거절, 역할 관리 기능
5. **일정 관리**: 개인 및 그룹 캘린더를 통한 미팅 일정 조율
6. **개인 대시보드**: 활동 현황, 통계, 일정을 한눈에 볼 수 있는 대시보드
7. **프로필 관리**: 개인 정보, 관심사, 학습 목표 설정
8. **그룹 추천**: 사용자의 관심사를 기반으로 한 스마트 그룹 추천
9. **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 환경에서 최적화
10. **다크모드 지원**: 사용자 편의성을 위한 테마 변경 기능

---

## 3. 사용된 기술 스택과 적용 사례

### Frontend 기술과 적용 위치

#### **React 18** - 컴포넌트 기반 아키텍처
- **적용 위치**: 모든 UI 컴포넌트 (`src/components/`, `src/pages/`)
- **활용 기능**: useState, useEffect, useCallback 등 최신 Hooks 활용
- **구체적 예시**: `DashboardPage.jsx`에서 실시간 시계, 타이머, 통계 등 다중 상태 관리

#### **React Bootstrap** - UI 컴포넌트 시스템
- **적용 위치**: 모든 폼, 버튼, 카드 컴포넌트
- **커스터마이징**: Bootstrap 기본 스타일에 CSS Variables로 브랜드 색상 적용
- **반응형**: Grid 시스템으로 모바일-우선 레이아웃 구현

#### **React Big Calendar** - 캘린더 기능
- **적용 위치**: `src/components/schedule/CalendarView.jsx`
- **한글화**: date-fns 라이브러리와 ko 로케일로 완전 한국어 지원
- **커스터마이징**: 개인 일정(초록색)과 그룹 일정(파란색) 색상 구분

### Backend 기술과 Firebase 활용 전략

#### **Firebase의 전략적 선택 이유**
기존 RESTful API 방식 대신 Firebase를 선택한 이유:

1. **직접적인 데이터베이스 접근**
   - 전통적 방식: Frontend → Express API → Database
   - Firebase 방식: Frontend → Firestore (직접 접근)
   - **장점**: API 개발 시간 단축, 실시간 동기화 자동 구현

2. **개발 단계별 접근법**
   - **1단계**: 모든 기능을 Frontend + Firestore로 구현
   - **2단계**: 보안이 중요한 Auth 기능만 Backend로 이관
   - **현재 상황**: 시간 제약으로 Auth 기능만 Backend 이관 완료

#### **현재 아키텍처 구조**
```
Frontend (React)
├── Authentication → Backend (Express + Firebase Admin)
├── User Profile → Firestore (직접 접근)
├── Group Management → Firestore (직접 접근)
├── Schedule Management → Firestore (직접 접근)
└── Dashboard Data → Firestore (직접 접근)
```

---

## 4. 개발 접근 방식 및 핵심 전략

저희의 페이지 디자인을 보여드리기 전에, 저희가 어떤 점에 초점을 맞춰 개발을 진행했는지 설명드리겠습니다.

저희는 **빠른 개발**, **재사용성**, **모듈화**, **모던 React Hook의 활용**, 그리고 **실제 웹개발과 유사한 프로젝트 구성**에 중점을 두고 개발을 진행했습니다.

### 4.1 Firebase SDK를 활용한 빠른 개발

먼저 빠른 개발을 위해 전통적인 **Frontend → Backend → Database** 구조가 아닌, Firebase SDK를 사용해서 백엔드 구축 없이 바로 **Frontend → Database**로 접근이 가능한 구조를 선택했습니다.

```jsx
// Firebase SDK 초기 설정 (src/firebase.js)
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Firebase 프로젝트 설정 정보
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
```

이를 통해 즉시 데이터베이스 작업을 시작할 수 있었고, 실시간 동기화도 자동으로 구현되었습니다.

### 4.2 단계적 Backend 마이그레이션 전략

개발 완료 후 점진적으로 Backend로 마이그레이션하는 전략을 세웠습니다.

**마이그레이션 이유:**
1. **학습한 기술 활용**: Node.js와 Express를 배웠기 때문
2. **프론트엔드 직접 DB 접근의 한계점**:
   - 보안 취약성: API 키와 데이터베이스 규칙이 클라이언트에 노출
   - 비즈니스 로직 분산: 복잡한 데이터 처리 로직이 프론트엔드에 흩어짐
   - 확장성 제한: 서버 사이드 검증, 데이터 변환, 외부 API 연동의 어려움
   - 성능 최적화 부족: 서버 레벨의 데이터 캐싱과 최적화 불가능

**현재 상태**: 시간 제약으로 인해 Authentication 기능만 Backend로 이관 완료

### 4.3 체계적인 컴포넌트 아키텍처

**재사용성을 위한 컴포넌트 분류:**

```
src/components/
├── common/           # 공통 UI 컴포넌트
│   ├── BaseModal.jsx     # 모든 모달의 기본 틀
│   ├── UniversalCard.jsx # 재사용 가능한 카드 컴포넌트
│   └── StatWidget.jsx    # 통계 위젯
├── dashboard/        # 대시보드 전용 컴포넌트
│   ├── MyGroupsComponent.jsx
│   ├── UpcomingEventsComponent.jsx
│   └── GroupRecommendationComponent.jsx
├── groups/          # 그룹 관련 컴포넌트
└── schedule/        # 스케줄 관련 컴포넌트
```

**CSS 모듈화:**
```
src/styles/
├── core/            # 전역 변수, 기본 스타일
├── components/      # 컴포넌트별 스타일
└── pages/          # 페이지별 스타일
```

### 4.4 모던 React Hook 활용

**사용한 표준 Hook들:**
- `useState`, `useEffect`: 기본 상태 관리
- `useCallback`, `useMemo`: 성능 최적화
- `useContext`: 전역 상태 관리 (다크모드, 인증)

**개발한 커스텀 Hook들:**

```jsx
// 1. useUIState.jsx - UI 상태 통합 관리
const useUIState = (initialData, options) => {
  // 모달, 로딩, 알림, 폼 상태를 한 번에 관리
  return {
    state, updateState, showError, showSuccess,
    openModal, closeModal, setLoading, ...
  };
};

// 2. useFirebaseData.jsx - Firestore 데이터 실시간 조회
const useFirebaseData = (collection, query) => {
  // 실시간 데이터 동기화와 로딩 상태 자동 관리
  return { data, loading, error };
};

// 3. useApi.jsx - API 호출 통합 관리
const useApi = () => {
  // 로딩 상태와 에러 처리가 포함된 API 호출
  return { callApi, loading, error };
};
```

### 4.5 실제 웹개발 환경 구축

**코드 품질 관리:**
```json
// .eslintrc.json & .prettierrc
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

**현대적 빌드 도구:**
- **Vite**: 빠른 개발 서버와 빌드
- **React Router**: SPA 라우팅
- **CSS Variables**: 다크모드 테마 시스템

---

## 5. UI/UX 구현 및 기술적 세부사항

이제 각 페이지별로 어떻게 구현했는지 코드 스니펫과 함께 설명드리겠습니다.

### 5.1 AppNavbar - 통합 네비게이션 시스템

**주요 기능:**
- 다크모드 컨텍스트를 통한 테마 변경
- useAuth 훅을 통한 실시간 로그인 상태 확인
- useNotification 훅을 통한 알림 시스템

```jsx
// src/components/AppNavbar.jsx
const AppNavbar = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { currentUser, logout } = useAuth();
  const { notifications } = useNotification();

  return (
    <Navbar className="custom-navbar" data-bs-theme={isDarkMode ? 'dark' : 'light'}>
      {/* 다크모드 토글 버튼 */}
      <Button onClick={toggleDarkMode} variant="outline-secondary">
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </Button>
      
      {/* 로그인 상태에 따른 조건부 렌더링 */}
      {currentUser ? (
        <NavDropdown title={currentUser.displayName}>
          <NavDropdown.Item onClick={logout}>로그아웃</NavDropdown.Item>
        </NavDropdown>
      ) : (
        <Nav.Link href="/login">로그인</Nav.Link>
      )}
    </Navbar>
  );
};
```

### 5.2 HomePage - 반응형 웰컴 페이지

**구현 특징:**
- Viewport 진입 시 카드 opacity 애니메이션
- currentUser 상태에 따른 조건부 버튼 표시

```jsx
// src/pages/HomePage.jsx
const HomePage = () => {
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => observer.observe(card));
    
    return () => observer.disconnect();
  }, []);

  return (
    <Container>
      {/* 기능 소개 카드들 */}
      <Row>
        {features.map((feature, index) => (
          <Col md={4} key={index}>
            <Card className={`feature-card ${isVisible ? 'visible' : ''}`}>
              <Card.Body>{feature.content}</Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* 조건부 회원가입 유도 버튼 */}
      {!currentUser && (
        <div className="signup-prompt">
          <Button size="lg" href="/register">
            지금 시작하기
          </Button>
        </div>
      )}
    </Container>
  );
};
```

### 5.3 DashboardPage - 통합 정보 대시보드

**컴포넌트 분리 설계:**
대시보드의 각 기능을 독립적인 컴포넌트로 분리하여 유지보수성과 재사용성을 높였습니다.

```jsx
// src/pages/DashboardPage.jsx
const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { userGroups } = useFirebaseData('userGroups', currentUser?.uid);

  return (
    <Container>
      <Row>
        {/* 각 기능을 별도 컴포넌트로 분리 */}
        <Col lg={8}>
          <UpcomingEventsComponent />
          <MyGroupsComponent groups={userGroups} />
        </Col>
        <Col lg={4}>
          <GroupRecommendationComponent />
          <GroupRequestsComponent />
        </Col>
      </Row>
    </Container>
  );
};

// src/components/dashboard/UpcomingEventsComponent.jsx
const UpcomingEventsComponent = () => {
  const { events, loading } = useFirebaseData('events');
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <UniversalCard title="다가오는 일정">
      {events.map(event => (
        <ListItem key={event.id} event={event} />
      ))}
    </UniversalCard>
  );
};
```

### 5.4 GroupsPage - 그룹 관리 시스템

**그룹 데이터 실시간 동기화:**

```jsx
// src/pages/GroupsPage.jsx
const GroupsPage = () => {
  const { currentUser } = useAuth();
  const { 
    myGroups, 
    loading: myGroupsLoading 
  } = useFirebaseData('myGroups', currentUser?.uid);
  
  const {
    availableGroups,
    loading: availableGroupsLoading
  } = useFirebaseData('availableGroups');

  return (
    <Container>
      {/* 내 그룹 섹션 */}
      <Section title="참여 중인 그룹">
        {myGroupsLoading ? (
          <LoadingSpinner />
        ) : (
          <Row>
            {myGroups.map(group => (
              <Col md={6} lg={4} key={group.id}>
                <GroupCard group={group} isMember={true} />
              </Col>
            ))}
          </Row>
        )}
      </Section>
      
      {/* 가입 가능한 그룹 섹션 */}
      <Section title="가입 가능한 그룹">
        <GroupList groups={availableGroups} loading={availableGroupsLoading} />
      </Section>
    </Container>
  );
};
```

### 5.5 SchedulePage - 통합 캘린더 시스템

**개인/그룹 일정 통합 표시:**

```jsx
// src/pages/SchedulePage.jsx
const SchedulePage = () => {
  const { currentUser } = useAuth();
  const { 
    userEvents, 
    groupEvents, 
    loading 
  } = useFirebaseData(['userEvents', 'groupEvents'], currentUser?.uid);

  // 개인 일정과 그룹 일정을 하나의 배열로 통합
  const allEvents = useMemo(() => {
    const personalEvents = userEvents.map(event => ({
      ...event,
      type: 'personal',
      color: '#28a745' // 초록색
    }));
    
    const groupEventsList = groupEvents.map(event => ({
      ...event,
      type: 'group',
      color: '#007bff' // 파란색
    }));
    
    return [...personalEvents, ...groupEventsList];
  }, [userEvents, groupEvents]);

  return (
    <Container>
      <Row>
        <Col lg={8}>
          <CalendarView 
            events={allEvents}
            onSelectEvent={handleEventSelect}
            onSelectSlot={handleSlotSelect}
          />
        </Col>
        <Col lg={4}>
          <ScheduleManager />
          <EventForm />
        </Col>
      </Row>
    </Container>
  );
};
```

**캘린더 컴포넌트 커스터마이징:**

```jsx
// src/components/schedule/CalendarView.jsx
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko'; // 한국어 설정

moment.locale('ko');
const localizer = momentLocalizer(moment);

const CalendarView = ({ events, onSelectEvent, onSelectSlot }) => {
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '5px',
      border: 'none',
      color: 'white',
      fontSize: '12px'
    }
  });

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      eventPropGetter={eventStyleGetter}
      messages={{
        next: "다음",
        previous: "이전",
        today: "오늘",
        month: "월",
        week: "주",
        day: "일"
      }}
      selectable
      popup
    />
  );
};
```

### 5.6 ProfilePage - 사용자 정보 관리

**실시간 프로필 업데이트:**

```jsx
// src/pages/ProfilePage.jsx
const ProfilePage = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { isLoading, startLoading } = useLoading();
  const { showSuccess, showError } = useUIState();

  const handleProfileUpdate = async (formData) => {
    try {
      await startLoading(
        updateUserProfile(formData)
      );
      showSuccess('프로필이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      showError('프로필 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <Container>
      <Row>
        <Col lg={8}>
          <ProfileForm 
            initialData={currentUser}
            onSubmit={handleProfileUpdate}
            loading={isLoading}
          />
        </Col>
        <Col lg={4}>
          <ProfileSidebar user={currentUser} />
        </Col>
      </Row>
    </Container>
  );
};
```

### 5.7 애플리케이션 구조 통합

**App.jsx - 라우팅 및 컨텍스트 관리:**

```jsx
// src/App.jsx
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DarkModeProvider>
          <div className="App" data-theme="auto">
            <AppNavbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/groups" element={
                  <ProtectedRoute>
                    <GroupsPage />
                  </ProtectedRoute>
                } />
                <Route path="/schedule" element={
                  <ProtectedRoute>
                    <SchedulePage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </DarkModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
```

**main.jsx - 애플리케이션 진입점:**

```jsx
// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/core/Variables.css';
import './styles/index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 6. 프로젝트 성과 및 학습 결과

### 6.1 기술적 성과
- **모던 React 개발 패턴 습득**: Hook 기반 함수형 컴포넌트 전면 활용
- **상태 관리 최적화**: Context API와 커스텀 Hook을 통한 효율적인 전역 상태 관리
- **Firebase 실무 활용**: 실시간 데이터베이스와 인증 시스템 구축
- **컴포넌트 재사용성**: 체계적인 컴포넌트 아키텍처 설계
- **반응형 디자인**: 모바일-우선 접근법으로 모든 디바이스 대응

### 6.2 개발 프로세스 개선
- **ESLint + Prettier**: 코드 품질과 일관성 확보
- **모듈화된 CSS**: 유지보수 가능한 스타일 시스템 구축
- **단계적 백엔드 마이그레이션**: 점진적 아키텍처 개선 전략

### 6.3 사용자 경험 향상
- **다크모드 지원**: 사용자 편의성 개선
- **실시간 데이터 동기화**: 즉각적인 사용자 피드백
- **직관적인 UI**: 사용자 친화적인 인터페이스 설계

---

## 7. 마무리

StudyBuddy 프로젝트를 통해 저희는 단순히 기능을 구현하는 것을 넘어서, **실제 웹 개발 환경과 유사한 전문적인 개발 프로세스**를 경험할 수 있었습니다.

특히 **Firebase를 활용한 빠른 프로토타이핑**부터 **점진적인 백엔드 마이그레이션**까지, 실무에서 자주 사용되는 개발 전략을 직접 적용해볼 수 있었던 것이 가장 큰 성과라고 생각합니다.

또한 **모던 React 개발 패턴**과 **체계적인 컴포넌트 아키텍처**를 통해 확장 가능하고 유지보수가 용이한 코드베이스를 구축할 수 있었습니다.

앞으로는 시간 제약으로 완료하지 못한 **전체 백엔드 마이그레이션**과 **고급 기능들**(푸시 알림, 실시간 채팅 등)을 추가하여 더욱 완성도 높은 서비스로 발전시켜 나가고 싶습니다.

감사합니다.