# StudyBuddy 커스텀 훅(Custom Hooks) 완전 가이드

## 개요
StudyBuddy 프로젝트에서는 재사용 가능한 로직을 캡슐화하고 컴포넌트 간 상태 관리를 효율적으로 하기 위해 5개의 커스텀 훅을 사용합니다. 각 훅은 특정한 목적과 책임을 가지고 있으며, 전체 애플리케이션의 상태 관리와 사용자 경험을 향상시킵니다.

## 📂 훅 파일 구조
```
client/src/hooks/
├── UseLoading.jsx        # 비동기 작업 로딩 상태 관리
├── useApi.jsx           # Firebase API 호출 관리
├── useFirebaseData.jsx  # Firebase 데이터 페칭 전용
├── useNotification.jsx  # 알림 메시지 통합 관리
└── useUIState.jsx       # 포괄적 UI 상태 관리
```

---

## 🔄 1. useLoading 훅

### 목적
비동기 작업(API 호출, 데이터 로딩 등)의 로딩 상태를 안전하게 관리하고, 컴포넌트 언마운트 시 메모리 누수를 방지합니다.

### 주요 기능
- **로딩 상태 관리**: `isLoading` 상태로 현재 로딩 여부 추적
- **컴포넌트 안전성**: 언마운트된 컴포넌트에서 상태 업데이트 방지
- **중복 요청 방지**: 이미 로딩 중일 때 새로운 요청 차단
- **메모리 누수 방지**: `useRef`로 마운트 상태 추적

### 사용법
```javascript
import useLoading from '../hooks/UseLoading';

function MyComponent() {
  const [isLoading, startLoading] = useLoading();
  
  const handleDataFetch = async () => {
    try {
      const result = await startLoading(
        // 비동기 함수 전달
        () => fetch('/api/data').then(res => res.json())
      );
      console.log('데이터:', result);
    } catch (error) {
      console.error('에러:', error);
    }
  };
  
  return (
    <div>
      {isLoading && <LoadingSpinner />}
      <button onClick={handleDataFetch} disabled={isLoading}>
        {isLoading ? '로딩 중...' : '데이터 가져오기'}
      </button>
    </div>
  );
}
```

### 핵심 메커니즘
```javascript
const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(true); // 컴포넌트 마운트 상태 추적
  
  const startLoading = useCallback(async (promise) => {
    // 1. 컴포넌트 언마운트 확인
    if (!mounted.current) return Promise.reject(new Error("Component unmounted"));
    
    // 2. 중복 요청 방지
    if (isLoading) return Promise.reject(new Error("Loading already in progress"));
    
    // 3. 로딩 시작
    setIsLoading(true);
    
    try {
      const result = await promise;
      if (mounted.current) setIsLoading(false); // 안전한 상태 업데이트
      return result;
    } catch (error) {
      if (mounted.current) setIsLoading(false);
      throw error;
    }
  }, [isLoading]);
  
  return [isLoading, startLoading];
};
```

### 실제 프로젝트 사용 예시
- **AuthContext**: 로그인/회원가입/로그아웃 처리
- **GroupDetailPage**: 그룹 정보 로딩
- **ProfilePage**: 프로필 업데이트

---

## 🌐 2. useApi 훅

### 목적
Firebase Firestore와의 API 통신을 단순화하고 표준화된 인터페이스를 제공합니다.

### 주요 기능
- **Firebase 통합**: Firestore의 문서 조회 및 컬렉션 쿼리
- **자동 실행**: 컴포넌트 마운트 시 자동으로 API 호출 (옵션)
- **필터링 지원**: `where` 조건으로 데이터 필터링
- **데이터 변환**: `transform` 함수로 응답 데이터 가공
- **에러 처리**: 통합된 에러 상태 관리

### 사용법
```javascript
import useApi from '../hooks/useApi';

function UserProfile({ userId }) {
  // 단일 문서 조회
  const { data: user, loading, error, refetch } = useApi(
    `users/${userId}`, // Firestore 경로
    {
      apiType: "firebase",
      firebaseOperation: "get", // 단일 문서
      executeOnMount: true,     // 자동 실행
      onSuccess: (data) => console.log('사용자 데이터:', data),
      onError: (err) => console.error('에러:', err)
    }
  );
  
  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  
  return (
    <div>
      <h1>{user?.displayName}</h1>
      <p>{user?.email}</p>
      <button onClick={refetch}>새로고침</button>
    </div>
  );
}

function GroupList() {
  // 컬렉션 쿼리 (필터링)
  const { data: groups, loading } = useApi(
    "groups", // 컬렉션 이름
    {
      apiType: "firebase",
      firebaseOperation: "list", // 컬렉션 조회
      firebaseFilters: [
        { field: "isActive", operator: "==", value: true },
        { field: "memberCount", operator: ">=", value: 2 }
      ],
      transform: (data) => data.sort((a, b) => b.createdAt - a.createdAt)
    }
  );
  
  return (
    <div>
      {loading ? '로딩 중...' : 
        groups?.map(group => (
          <div key={group.id}>{group.name}</div>
        ))
      }
    </div>
  );
}
```

### 핵심 구조
```javascript
const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const execute = async () => {
    setLoading(true);
    try {
      let result = null;
      
      if (firebaseOperation === "get") {
        // 단일 문서 조회
        const docSnap = await getDoc(doc(firestore, endpoint));
        result = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
      } else if (firebaseOperation === "list") {
        // 컬렉션 조회 + 필터링
        let q = collection(firestore, endpoint);
        firebaseFilters.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
        const snapshot = await getDocs(q);
        result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // 데이터 변환
      if (transform && result) result = transform(result);
      
      setData(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, execute, refetch: execute };
};
```

---

## 🔥 3. useFirebaseData 훅

### 목적
Firebase 데이터 페칭에 특화된 훅으로, 복잡한 Firebase 함수 호출을 간단하게 관리합니다.

### 주요 기능
- **함수 기반 실행**: Firebase 함수를 직접 전달하여 실행
- **의존성 추적**: 의존성이 변경될 때 자동으로 재실행
- **상태 관리**: 성공/에러/빈 데이터 상태 자동 판별
- **콜백 지원**: 성공/에러 시 추가 작업 실행
- **데이터 변환**: transform 함수로 데이터 가공

### 사용법
```javascript
import useFirebaseData from '../hooks/useFirebaseData';
import { getGroupById } from '../utils/GroupService';

function GroupDetail({ groupId }) {
  const {
    data: group,
    loading,
    error,
    refetch,
    isSuccess,
    isError,
    isEmpty
  } = useFirebaseData(
    // Firebase 함수 전달
    () => getGroupById(groupId),
    // 의존성 배열
    [groupId],
    // 옵션
    {
      enabled: !!groupId,  // groupId가 있을 때만 실행
      onSuccess: (data) => {
        console.log('그룹 데이터 로드 성공:', data);
      },
      onError: (error) => {
        console.error('그룹 로드 실패:', error);
      },
      transform: (data) => ({
        ...data,
        memberCount: data.members?.length || 0
      })
    }
  );
  
  if (loading) return <div>그룹 정보를 불러오는 중...</div>;
  if (isError) return <div>에러: {error}</div>;
  if (isEmpty) return <div>그룹을 찾을 수 없습니다.</div>;
  
  return (
    <div>
      <h1>{group.name}</h1>
      <p>멤버 수: {group.memberCount}</p>
      <button onClick={refetch}>새로고침</button>
    </div>
  );
}
```

### 고급 사용 예시
```javascript
// 여러 데이터를 동시에 로드
function Dashboard({ userId }) {
  const { data: userGroups } = useFirebaseData(
    () => getUserGroups(userId),
    [userId]
  );
  
  const { data: notifications } = useFirebaseData(
    () => getNotifications(userId),
    [userId],
    {
      enabled: !!userId,
      transform: (data) => data.filter(n => !n.isRead)
    }
  );
  
  const { data: upcomingEvents } = useFirebaseData(
    () => getUpcomingEvents(userId),
    [userId, userGroups],
    {
      enabled: !!userId && !!userGroups,
      onSuccess: (events) => {
        // 이벤트 알림 설정
        events.forEach(event => setEventReminder(event));
      }
    }
  );
  
  return (
    <div>
      <MyGroups groups={userGroups} />
      <Notifications items={notifications} />
      <UpcomingEvents events={upcomingEvents} />
    </div>
  );
}
```

### 핵심 로직
```javascript
const useFirebaseData = (fetchFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const fetchData = useCallback(async () => {
    if (!fetchFunction) return;
    
    try {
      setLoading(true);
      setError("");
      
      const result = await fetchFunction();
      const finalData = transform ? transform(result) : result;
      
      setData(finalData);
      if (onSuccess) onSuccess(finalData);
      
    } catch (error) {
      setError(error.message || "데이터를 불러오는데 실패했습니다.");
      setData(null);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, transform]);
  
  useEffect(() => {
    if (enabled && fetchFunction) {
      fetchData();
    }
  }, [enabled, ...dependencies]);
  
  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && !!error,
    isEmpty: !loading && !error && data === null,
  };
};
```

---

## 📢 4. useNotification 훅

### 목적
에러, 성공, 정보 메시지를 통합 관리하고 자동 삭제 기능을 제공합니다.

### 주요 기능
- **3가지 메시지 타입**: error(에러), success(성공), info(정보)
- **자동 삭제**: success(3초), info(5초) 후 자동 제거
- **독점 표시**: 하나의 메시지만 표시 (새 메시지가 이전 메시지를 대체)
- **수동 제어**: 개별 또는 전체 메시지 삭제 기능
- **상태 확인**: 메시지 존재 여부 확인 함수들

### 사용법
```javascript
import useNotification from '../hooks/useNotification';

function LoginForm() {
  const {
    error,
    success,
    info,
    showError,
    showSuccess,
    showInfo,
    clearAll,
    hasError,
    hasAnyMessage
  } = useNotification();
  
  const handleLogin = async (email, password) => {
    try {
      clearAll(); // 이전 메시지 제거
      showInfo("로그인 중입니다...");
      
      await login(email, password);
      showSuccess("로그인에 성공했습니다!"); // 3초 후 자동 삭제
      
    } catch (error) {
      showError("로그인에 실패했습니다. 다시 시도해주세요."); // 수동 삭제까지 유지
    }
  };
  
  return (
    <form onSubmit={handleLogin}>
      {/* 알림 메시지 표시 */}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {info && <Alert variant="info">{info}</Alert>}
      
      {/* 폼 필드들 */}
      <input type="email" placeholder="이메일" />
      <input type="password" placeholder="비밀번호" />
      
      <button type="submit" disabled={hasAnyMessage}>
        로그인
      </button>
      
      {hasError && (
        <button type="button" onClick={clearAll}>
          에러 메시지 지우기
        </button>
      )}
    </form>
  );
}
```

### 실제 프로젝트 사용 패턴
```javascript
// AppNavbar.jsx에서의 사용
const AppNavbar = () => {
  const { showError, showSuccess, showInfo, clearAll } = useNotification();
  
  const handleSignup = async (userData) => {
    try {
      clearAll();
      await signup(userData);
      showSuccess("회원가입이 완료되었습니다. 프로필에서 이메일 인증을 완료해주세요.");
      
      setTimeout(() => {
        closeModal("signup");
        navigate("/profile");
      }, 1500);
    } catch (error) {
      showError("회원가입 중 오류가 발생했습니다: " + error.message);
    }
  };
  
  const handlePasswordReset = async (email) => {
    try {
      await resetPassword(email);
      showInfo("이메일로 비밀번호 재설정 안내가 발송되었습니다.");
      setTimeout(() => switchModal("forgot", "login"), 3000);
    } catch (error) {
      showError("비밀번호 재설정에 실패했습니다. 이메일 주소를 확인해주세요.");
    }
  };
};
```

### 자동 삭제 메커니즘
```javascript
// 성공 메시지 자동 삭제 (3초)
useEffect(() => {
  if (success) {
    const timer = setTimeout(() => {
      setSuccess("");
    }, 3000);
    return () => clearTimeout(timer); // 클린업
  }
}, [success]);

// 정보 메시지 자동 삭제 (5초)
useEffect(() => {
  if (info) {
    const timer = setTimeout(() => {
      setInfo("");
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [info]);
```

---

## 🎛️ 5. useUIState 훅 (가장 포괄적인 훅)

### 목적
모달, 로딩, 알림, 토글, 폼 상태 등 모든 UI 상태를 통합 관리하는 올인원 솔루션입니다.

### 주요 기능
- **통합 상태 관리**: 모든 UI 상태를 하나의 객체로 관리
- **로컬 스토리지 연동**: 상태 지속성 제공
- **모달 관리**: 여러 모달의 열림/닫힘 상태 관리
- **로딩 관리**: 비동기 작업별 로딩 상태 추적
- **폼 관리**: 입력 필드와 유효성 검사 통합
- **디바운스**: 상태 업데이트 지연으로 성능 최적화
- **알림 관리**: useNotification과 유사한 기능 내장

### 기본 사용법
```javascript
import useUIState from '../hooks/useUIState';

function ComplexComponent() {
  const ui = useUIState(
    // 초기 상태
    {
      isModalOpen: false,
      userName: "",
      isLoading: false,
      darkMode: false
    },
    // 옵션
    {
      persistToLocalStorage: true,
      localStorageKey: "complex-component-state",
      debounceTime: 300
    }
  );
  
  return (
    <div>
      <button onClick={() => ui.openModal('login')}>
        로그인 모달 열기
      </button>
      
      {ui.isModalOpen('login') && (
        <Modal onClose={() => ui.closeModal('login')}>
          <h2>로그인</h2>
        </Modal>
      )}
      
      <input
        {...ui.getFieldProps('userName')}
        placeholder="사용자 이름"
      />
      
      {ui.isLoading('login') && <div>로그인 중...</div>}
      
      <button
        onClick={() => ui.toggle('darkMode')}
        className={ui.get('darkMode') ? 'dark' : 'light'}
      >
        다크모드 토글
      </button>
    </div>
  );
}
```

### 모달 관리
```javascript
function ModalExample() {
  const ui = useUIState({
    loginModal: false,
    signupModal: false,
    settingsModal: false
  });
  
  const handleSwitchToSignup = () => {
    ui.closeModal('login');
    ui.openModal('signup');
  };
  
  return (
    <div>
      <button onClick={() => ui.openModal('login')}>로그인</button>
      <button onClick={() => ui.openModal('signup')}>회원가입</button>
      <button onClick={() => ui.openModal('settings')}>설정</button>
      
      {/* 한 번에 모든 모달 닫기 */}
      <button onClick={ui.closeAllModals}>모든 모달 닫기</button>
      
      {ui.isModalOpen('login') && (
        <LoginModal 
          onClose={() => ui.closeModal('login')}
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}
      
      {ui.isModalOpen('signup') && (
        <SignupModal onClose={() => ui.closeModal('signup')} />
      )}
      
      {ui.isModalOpen('settings') && (
        <SettingsModal onClose={() => ui.closeModal('settings')} />
      )}
    </div>
  );
}
```

### 로딩 상태 관리
```javascript
function DataManager() {
  const ui = useUIState();
  
  const loadUserData = async () => {
    try {
      const userData = await ui.startLoading('user', async () => {
        return await fetchUserData();
      });
      
      ui.showSuccess('사용자 데이터를 불러왔습니다.');
    } catch (error) {
      ui.showError('데이터 로딩에 실패했습니다.');
    }
  };
  
  const loadGroupData = async () => {
    ui.setLoading('group', true);
    try {
      const groupData = await fetchGroupData();
      ui.showSuccess('그룹 데이터를 불러왔습니다.');
    } catch (error) {
      ui.showError('그룹 데이터 로딩에 실패했습니다.');
    } finally {
      ui.setLoading('group', false);
    }
  };
  
  return (
    <div>
      <button 
        onClick={loadUserData} 
        disabled={ui.isLoading('user')}
      >
        {ui.isLoading('user') ? '사용자 데이터 로딩 중...' : '사용자 데이터 로드'}
      </button>
      
      <button 
        onClick={loadGroupData} 
        disabled={ui.isLoading('group')}
      >
        {ui.isLoading('group') ? '그룹 데이터 로딩 중...' : '그룹 데이터 로드'}
      </button>
    </div>
  );
}
```

### 폼 관리
```javascript
function UserProfileForm() {
  const ui = useUIState({
    displayName: "",
    email: "",
    department: "",
    bio: ""
  });
  
  const validateEmail = (email) => {
    if (!email) return "이메일은 필수입니다.";
    if (!email.includes("@")) return "유효한 이메일을 입력하세요.";
    return "";
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const isEmailValid = ui.validateField('email', validateEmail);
    const isNameValid = ui.validateField('displayName', (name) => 
      name.length < 2 ? "이름은 2글자 이상이어야 합니다." : ""
    );
    
    if (!isEmailValid || !isNameValid) {
      ui.showError("입력 정보를 확인해주세요.");
      return;
    }
    
    try {
      const formData = ui.getValues(['displayName', 'email', 'department', 'bio']);
      await ui.startLoading('submit', () => updateProfile(formData));
      
      ui.showSuccess("프로필이 업데이트되었습니다.");
      ui.resetForm(['displayName', 'email', 'department', 'bio']);
    } catch (error) {
      ui.showError("프로필 업데이트에 실패했습니다.");
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          {...ui.getFieldProps('displayName')}
          placeholder="이름"
        />
        {ui.get('displayNameError') && (
          <span className="error">{ui.get('displayNameError')}</span>
        )}
      </div>
      
      <div>
        <input
          {...ui.getFieldProps('email')}
          type="email"
          placeholder="이메일"
        />
        {ui.get('emailError') && (
          <span className="error">{ui.get('emailError')}</span>
        )}
      </div>
      
      <div>
        <input
          {...ui.getFieldProps('department')}
          placeholder="학과"
        />
      </div>
      
      <div>
        <textarea
          {...ui.getFieldProps('bio')}
          placeholder="자기소개"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={ui.isLoading('submit')}
      >
        {ui.isLoading('submit') ? '업데이트 중...' : '프로필 업데이트'}
      </button>
      
      <button 
        type="button" 
        onClick={() => ui.resetForm(['displayName', 'email', 'department', 'bio'])}
      >
        폼 리셋
      </button>
    </form>
  );
}
```

### 고급 기능들
```javascript
function AdvancedExample() {
  const ui = useUIState(
    { count: 0, filter: "", items: [] },
    { 
      persistToLocalStorage: true,
      localStorageKey: "advanced-example",
      debounceTime: 500 
    }
  );
  
  // 디바운스된 검색
  const handleSearch = (searchTerm) => {
    ui.debouncedUpdate('filter', searchTerm, 500);
  };
  
  // 조건부 업데이트
  const incrementIfEven = () => {
    ui.updateIf(
      ui.get('count') % 2 === 0,
      { count: ui.get('count') + 1 }
    );
  };
  
  // 상태 디버깅
  const debugCurrentState = () => {
    ui.debugState(); // 콘솔에 현재 상태 출력
  };
  
  return (
    <div>
      <h3>카운트: {ui.get('count', 0)}</h3>
      <button onClick={() => ui.setValue('count', ui.get('count') + 1)}>
        증가
      </button>
      <button onClick={incrementIfEven}>
        짝수일 때만 증가
      </button>
      
      <input
        placeholder="검색..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      <p>필터: {ui.get('filter')}</p>
      
      <button onClick={debugCurrentState}>
        상태 디버그
      </button>
      
      <button onClick={() => ui.resetState(['count', 'filter'])}>
        특정 상태만 리셋
      </button>
      
      <button onClick={ui.resetState}>
        전체 상태 리셋
      </button>
    </div>
  );
}
```

---

## 🔗 훅 간의 상호 작용 및 선택 가이드

### 1. 언제 어떤 훅을 사용할까?

#### useLoading 사용 시기
- ✅ 단순한 비동기 작업 로딩 상태만 필요할 때
- ✅ 컴포넌트 언마운트 안전성이 중요할 때
- ✅ 중복 요청 방지가 필요할 때

#### useApi 사용 시기
- ✅ Firebase Firestore와 직접 통신할 때
- ✅ 표준화된 API 호출 패턴이 필요할 때
- ✅ 자동 실행 및 재실행이 필요할 때

#### useFirebaseData 사용 시기
- ✅ 복잡한 Firebase 함수를 호출할 때
- ✅ 의존성에 따른 자동 재실행이 필요할 때
- ✅ 데이터 변환 로직이 복잡할 때

#### useNotification 사용 시기
- ✅ 단순한 알림 메시지만 필요할 때
- ✅ 자동 삭제 기능이 중요할 때
- ✅ 독립적인 알림 시스템이 필요할 때

#### useUIState 사용 시기
- ✅ 복잡한 UI 상태가 많을 때
- ✅ 모달, 폼, 로딩을 모두 관리해야 할 때
- ✅ 상태 지속성이 필요할 때
- ✅ 통합 관리의 이점이 클 때

### 2. 훅 조합 패턴

#### 패턴 1: 로딩 + 알림
```javascript
function DataComponent() {
  const [isLoading, startLoading] = useLoading();
  const { showError, showSuccess } = useNotification();
  
  const handleAction = async () => {
    try {
      const result = await startLoading(() => performAction());
      showSuccess("작업이 완료되었습니다.");
    } catch (error) {
      showError("작업 중 오류가 발생했습니다.");
    }
  };
}
```

#### 패턴 2: API + 알림
```javascript
function ListComponent() {
  const { data, loading, error, refetch } = useApi("items", {
    onSuccess: () => showSuccess("데이터를 불러왔습니다."),
    onError: () => showError("데이터 로딩에 실패했습니다.")
  });
  const { showSuccess, showError } = useNotification();
}
```

#### 패턴 3: Firebase 데이터 + UI 상태
```javascript
function ComplexComponent({ userId }) {
  const { data, loading } = useFirebaseData(
    () => getUserData(userId),
    [userId]
  );
  
  const ui = useUIState({
    editMode: false,
    selectedTab: 'profile'
  });
  
  if (loading) return <div>로딩 중...</div>;
  
  return (
    <div>
      <Tabs 
        activeTab={ui.get('selectedTab')} 
        onTabChange={(tab) => ui.setValue('selectedTab', tab)} 
      />
      
      {ui.get('editMode') ? (
        <EditForm 
          data={data} 
          onCancel={() => ui.setValue('editMode', false)}
        />
      ) : (
        <DisplayData 
          data={data} 
          onEdit={() => ui.setValue('editMode', true)}
        />
      )}
    </div>
  );
}
```

### 3. 성능 최적화 팁

#### 메모이제이션 활용
```javascript
// useCallback으로 함수 메모이제이션
const memoizedFetchFunction = useCallback(() => {
  return getGroupData(groupId);
}, [groupId]);

const { data } = useFirebaseData(memoizedFetchFunction, [groupId]);
```

#### 조건부 실행
```javascript
// enabled 옵션으로 불필요한 실행 방지
const { data } = useFirebaseData(
  () => getDataById(id),
  [id],
  { enabled: !!id && userHasPermission }
);
```

#### 상태 분리
```javascript
// 관련 없는 상태는 분리하여 불필요한 리렌더링 방지
const authUI = useUIState({ isLoginOpen: false });
const dataUI = useUIState({ isLoading: false, filter: "" });
```

---

## 📋 실제 프로젝트에서의 활용 사례

### 1. AuthContext.jsx
```javascript
// useUIState로 로딩 상태 통합 관리
const ui = useUIState({
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingOut: false,
  isResettingPassword: false,
  isUpdatingProfile: false
});

const login = async (email, password) => {
  return await ui.startLoading("isLoggingIn", async () => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // 서버 인증 로직...
    return userCredential;
  });
};
```

### 2. AppNavbar.jsx
```javascript
// useNotification으로 모달 내 알림 관리
const { error, success, info, showError, showSuccess, showInfo, clearAll } = useNotification();

const handleSignup = async (e) => {
  try {
    clearAll();
    await signup(email, password, displayName);
    showSuccess("회원가입이 완료되었습니다.");
  } catch (error) {
    showError("계정 생성 중 오류가 발생했습니다: " + error.message);
  }
};
```

### 3. GroupDetailPage.jsx
```javascript
// useFirebaseData로 그룹 상세 정보 로드
const { data: group, loading, error, refetch } = useFirebaseData(
  () => getGroupById(groupId),
  [groupId],
  {
    enabled: !!groupId,
    onSuccess: (groupData) => {
      setDocumentTitle(`${groupData.name} - StudyBuddy`);
    }
  }
);
```

### 4. CreateGroupForm.jsx
```javascript
// useLoading으로 폼 제출 상태 관리
const [isSubmitting, startSubmitting] = useLoading();

const handleSubmit = async (formData) => {
  try {
    const result = await startSubmitting(() => createGroup(formData));
    onSuccess(result);
  } catch (error) {
    setError(error.message);
  }
};
```

---

## 🛠️ 훅 개발 시 주의사항

### 1. 메모리 누수 방지
```javascript
// ✅ 올바른 방법
const mounted = useRef(true);
useEffect(() => {
  return () => {
    mounted.current = false;
  };
}, []);

// ❌ 잘못된 방법 - 언마운트 후에도 상태 업데이트 시도
const [data, setData] = useState(null);
useEffect(() => {
  fetchData().then(setData); // 컴포넌트가 언마운트되어도 실행됨
}, []);
```

### 2. 의존성 배열 최적화
```javascript
// ✅ 올바른 방법 - 의존성 최소화
const fetchData = useCallback(async () => {
  // 함수 내용
}, [essentialDependency]);

// ❌ 잘못된 방법 - 불필요한 의존성
const fetchData = useCallback(async () => {
  // 함수 내용
}, [a, b, c, d]); // 모든 변수를 의존성에 추가
```

### 3. 상태 업데이트 일관성
```javascript
// ✅ 올바른 방법 - 함수형 업데이트
setState(prev => ({ ...prev, newValue: value }));

// ❌ 잘못된 방법 - 직접 참조
setState({ ...state, newValue: value }); // 이전 상태가 최신이 아닐 수 있음
```

---

## 📈 성능 모니터링 및 디버깅

### 1. 개발자 도구 활용
```javascript
// 상태 변화 로깅
useEffect(() => {
  console.log('State changed:', state);
}, [state]);

// 성능 측정
console.time('data-fetch');
const data = await fetchData();
console.timeEnd('data-fetch');
```

### 2. React DevTools Profiler
- 컴포넌트 리렌더링 횟수 모니터링
- 훅의 성능 영향 분석
- 메모이제이션 효과 확인

### 3. 커스텀 디버깅 훅
```javascript
const useDebugState = (state, name) => {
  useEffect(() => {
    console.group(`🔍 ${name} State Debug`);
    console.log('Current State:', state);
    console.log('State Type:', typeof state);
    console.log('State Keys:', Object.keys(state || {}));
    console.groupEnd();
  }, [state, name]);
};

// 사용
const state = useUIState({ count: 0 });
useDebugState(state.state, 'Counter');
```

---

## 🎯 결론 및 권장사항

StudyBuddy의 커스텀 훅들은 각각 특별한 용도와 장점을 가지고 있습니다:

1. **단순함을 유지하라**: 작은 기능에는 작은 훅을 사용
2. **일관성을 지켜라**: 프로젝트 전체에서 동일한 패턴 사용
3. **성능을 고려하라**: 불필요한 리렌더링과 메모리 누수 방지
4. **테스트를 작성하라**: 훅의 동작을 검증하는 테스트 코드 작성
5. **문서화하라**: 훅의 용도와 사용법을 명확히 문서화

이러한 커스텀 훅들을 잘 활용하면 더 깔끔하고 유지보수하기 쉬운 React 애플리케이션을 만들 수 있습니다.