# StudyBuddy 프로젝트 진행 보고서

## 1. 프로젝트 개요

StudyBuddy는 학생들이 스터디 그룹을 쉽게 만들고 참여하며, 일정을 조율하고 실시간으로 소통할 수 있는 웹 애플리케이션입니다. 이 프로젝트는 웹 개발 과목의 기말 과제로 진행되었으며, 총 2명(본인과 팀원님)이 함께 개발하였습니다.

### 1.1 프로젝트 목표

- 사용자 인증 시스템 구현 (회원가입, 로그인, 로그아웃)
- 스터디 그룹 생성 및 관리 기능 구현
- 그룹 내 일정 관리 및 공통 가능 시간 찾기 기능
- 실시간 그룹 채팅 기능
- 사용자 프로필 관리

### 1.2 기술 스택 선정

프로젝트를 시작하기 전, 다양한 기술 스택 옵션을 검토하고 팀원 간 논의를 통해 최종 결정하였습니다.

**프론트엔드 프레임워크 선정 과정:**

```
본인: "프론트엔드 프레임워크로 어떤 것을 사용하면 좋을까요? React, Vue, Angular 중에서 고려해볼 수 있을 것 같아요."

팀원님: "React가 생태계가 가장 크고, 취업 시에도 도움이 될 것 같아요. 또한 Firebase와의 통합도 잘 되어 있어서 React를 사용하는 것이 좋을 것 같습니다."

본인: "저도 동의합니다. React를 사용하면 컴포넌트 기반 개발로 코드 재사용성도 높일 수 있고, Context API를 활용해 상태 관리도 할 수 있을 것 같네요."

팀원님: "빌드 도구는 Create React App보다 Vite를 사용하면 어떨까요? 개발 서버 시작이 빠르고 핫 리로딩 성능도 좋다고 들었어요."

본인: "좋은 제안이네요. Vite를 사용해서 개발 경험을 향상시키고, 최신 기술을 경험해보는 것도 좋을 것 같습니다."
```

**백엔드 기술 선정 과정:**

```
팀원님: "백엔드는 Node.js와 Express를 사용하는 것이 어떨까요? JavaScript를 프론트와 백엔드 모두에서 사용할 수 있어서 효율적일 것 같아요."

본인: "저도 그 의견에 동의합니다. 또한 데이터베이스는 Firebase Firestore를 사용하면 실시간 기능 구현이 용이할 것 같아요."

팀원님: "맞아요. Firebase는 인증, 데이터베이스, 호스팅까지 통합적으로 제공하니 개발 속도를 높일 수 있을 것 같습니다. 특히 실시간 채팅 기능에 적합할 것 같아요."

본인: "그럼 백엔드는 Node.js와 Express로, 데이터베이스는 Firebase로 결정하는 것으로 하겠습니다."
```

**상태 관리 라이브러리 사용 여부:**

```
팀원님: "프로젝트가 커지면 상태 관리가 복잡해질 수 있는데, Redux나 MobX 같은 상태 관리 라이브러리를 사용할 필요가 있을까요?"

본인: "좋은 질문이네요. 최근에는 Zustand라는 가벼운 상태 관리 라이브러리도 많이 사용하는 것 같아요. 하지만 우리 프로젝트 규모를 고려했을 때, 초기에는 React의 Context API로 충분할 것 같습니다."

팀원님: "저도 그렇게 생각합니다. 필요하다면 나중에 Zustand를 도입할 수도 있을 것 같고, 과도한 복잡성은 피하는 것이 좋을 것 같아요."

본인: "맞습니다. 일단은 Context API로 시작하고, 필요시 확장하는 방향으로 가겠습니다. 미래에 이 프로젝트를 React Native로 확장할 가능성이 있다면 그때 Zustand 같은 라이브러리를 고려해볼 수 있을 것 같아요."
```

### 1.3 최종 선택 기술 스택

- **프론트엔드**: React + Vite, Bootstrap, React Router
- **백엔드**: Node.js, Express
- **데이터베이스**: Firebase (Authentication, Firestore)
- **상태 관리**: React Context API
- **기타 도구**: Git, GitHub

## 2. 개발 환경 설정

### 2.1 프로젝트 초기화

프로젝트를 체계적으로 관리하기 위해 Git과 GitHub를 활용하여 버전 관리 시스템을 구축했습니다.

```
본인: "소스 코드 관리를 위해 GitHub 저장소를 만들었습니다. 클론해서 작업하시면 됩니다."

팀원님: "감사합니다. 브랜치 전략은 어떻게 가져갈까요?"

본인: "기능별로 브랜치를 만들어 작업하고, 완료 후 main 브랜치로 병합하는 방식이 좋을 것 같습니다. feature/인증, feature/그룹관리 같은 형식으로요."

팀원님: "좋은 생각이네요. 그렇게 진행하도록 하겠습니다."
```

### 2.2 프론트엔드 설정

Vite를 사용하여 React 프로젝트를 초기화하고, 필요한 패키지들을 설치했습니다.

```bash
npm create vite@latest client -- --template react
cd client
npm install react-router-dom axios bootstrap firebase
```

프론트엔드 폴더 구조를 다음과 같이 설계했습니다:

```
client/src/
├── components/    # 재사용 가능한 UI 컴포넌트
│   ├── layout/    # 레이아웃 관련 컴포넌트
│   └── ui/        # UI 컴포넌트
├── pages/         # 페이지 컴포넌트
│   ├── group/     # 그룹 관련 페이지
│   └── Home.jsx   # 홈 페이지
├── services/      # API 호출 로직
├── utils/         # 유틸리티 함수
├── firebase.js    # Firebase 설정
├── App.jsx        # 메인 애플리케이션 컴포넌트
└── main.jsx       # 진입점
```

### 2.3 백엔드 설정

Node.js와 Express를 사용하여 백엔드 서버를 설정하고, 필요한 패키지들을 설치했습니다.

```bash
mkdir server
cd server
npm init -y
npm install express firebase cors dotenv
npm install -D nodemon
```

백엔드 폴더 구조를 다음과 같이 설계했습니다:

```
server/
├── config/        # 설정 파일
├── controllers/   # API 컨트롤러
├── middleware/    # 미들웨어
├── routes/        # API 라우트
├── .env           # 환경 변수
└── server.js      # 메인 서버 파일
```

### 2.4 Firebase 설정

Firebase 프로젝트를 생성하고, 웹 앱을 등록한 후 필요한 설정 정보를 가져왔습니다.

```javascript
// client/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

API 키 등의 민감한 정보는 환경 변수로 관리하기 위해 `.env` 파일을 생성했습니다.

```
# client/.env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2.5 Firebase 보안 규칙 설정

Firebase Firestore의 보안을 강화하기 위해 다음과 같은 보안 규칙을 설정했습니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 접근 가능하도록 하는 함수
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // 요청한 사용자가 해당 문서의 소유자인지 확인하는 함수
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // 사용자 컬렉션 규칙
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // 그룹 컬렉션 규칙
    match /groups/{groupId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.creator_id == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                            get(/databases/$(database)/documents/groups/$(groupId)).data.creator_id == request.auth.uid;
    }
    
    // 추가 컬렉션에 대한 규칙...
  }
}
```

```
팀원님: "Firebase 보안 규칙을 설정했는데, 이렇게 하면 인증된 사용자만 데이터에 접근할 수 있고 자신의 데이터만 수정할 수 있게 됩니다."

본인: "좋은 접근이네요. 특히 그룹 생성자에게만 수정 권한을 부여한 것이 적절해 보입니다. 보안이 중요하니 이런 부분을 신경 쓰는 것이 좋겠네요."
```

## 3. 데이터 모델 설계

팀원 간 논의를 통해 다음과 같은 데이터 모델을 설계했습니다:

### 3.1 Firestore 컬렉션 설계

```
collections/
├── users/                 # 사용자 정보
│   └── {userId}/          # 사용자 문서
│       ├── email          # 이메일
│       ├── name           # 이름
│       ├── department     # 학과
│       ├── interests      # 관심 주제 (배열)
│       └── created_at     # 계정 생성 시간
│
├── groups/                # 스터디 그룹
│   └── {groupId}/         # 그룹 문서
│       ├── name           # 그룹명
│       ├── description    # 설명
│       ├── topic          # 주제
│       ├── max_members    # 최대 인원
│       ├── creator_id     # 생성자 ID
│       ├── members        # 구성원 (배열)
│       ├── created_at     # 생성 시간
│       └── updated_at     # 마지막 업데이트 시간
│
├── group_requests/        # 그룹 참여 요청
│   └── {requestId}/       # 요청 문서
│       ├── group_id       # 그룹 ID
│       ├── user_id        # 요청 사용자 ID
│       ├── status         # 상태 (pending/accepted/rejected)
│       └── created_at     # 요청 시간
│
├── schedules/             # 일정 정보
│   └── {scheduleId}/      # 일정 문서
│       ├── user_id        # 사용자 ID
│       ├── available_times # 가능 시간 (배열)
│       └── updated_at     # 마지막 업데이트 시간
│
└── messages/              # 채팅 메시지
    └── {messageId}/       # 메시지 문서
        ├── group_id       # 그룹 ID
        ├── sender_id      # 발신자 ID
        ├── content        # 메시지 내용
        ├── created_at     # 발신 시간
        └── read_by        # 읽은 사용자 ID (배열)
```

```
본인: "데이터 모델은 어떻게 구성하면 좋을까요? 사용자, 그룹, 메시지 등의 컬렉션이 필요할 것 같아요."

팀원님: "네, 그리고 그룹 참여 요청을 별도 컬렉션으로 관리하면 승인/거절 처리가 용이할 것 같습니다."

본인: "일정 관리를 위한 스케줄 컬렉션도 필요할 것 같네요. 사용자별로 가능한 시간을 저장하고, 그룹 내에서 공통 시간을 계산하는 방식으로 가면 어떨까요?"

팀원님: "좋은 생각입니다. 그리고 메시지에는 읽음 여부를 추적하기 위해 'read_by' 필드를 추가하면 좋을 것 같아요."
```

## 4. API 설계

RESTful API 원칙에 따라 다음과 같은 API 엔드포인트를 설계했습니다:

### 4.1 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/user` - 현재 로그인된 사용자 정보 조회
- `POST /api/auth/logout` - 로그아웃

### 4.2 사용자 API
- `GET /api/users/{id}` - 사용자 정보 조회
- `PUT /api/users/{id}` - 사용자 정보 업데이트
- `GET /api/users/{id}/groups` - 사용자가 참여한 그룹 조회

### 4.3 그룹 API
- `GET /api/groups` - 모든 그룹 조회
- `POST /api/groups` - 새 그룹 생성
- `GET /api/groups/{id}` - 특정 그룹 조회
- `PUT /api/groups/{id}` - 그룹 정보 업데이트
- `DELETE /api/groups/{id}` - 그룹 삭제
- `POST /api/groups/{id}/join` - 그룹 참여 요청
- `GET /api/groups/{id}/requests` - 그룹 참여 요청 목록 조회
- `PUT /api/groups/{id}/requests/{requestId}` - 참여 요청 승인/거절

### 4.4 스케줄 API
- `POST /api/schedules` - 가능 시간 등록
- `GET /api/schedules/user/{userId}` - 사용자의 가능 시간 조회
- `GET /api/schedules/group/{groupId}` - 그룹의 공통 가능 시간 조회

### 4.5 메시지 API
- `GET /api/messages/group/{groupId}` - 그룹 메시지 조회
- `POST /api/messages/group/{groupId}` - 그룹에 메시지 전송
- `PUT /api/messages/{id}/read` - 메시지를 읽음으로 표시

```
팀원님: "API 엔드포인트는 RESTful 원칙을 따라 설계했습니다. 이렇게 하면 클라이언트-서버 간 통신이 일관성 있게 이루어질 수 있을 것 같아요."

본인: "좋습니다. 특히 그룹 참여 요청 API가 잘 설계된 것 같네요. 승인/거절 기능이 중요할 테니까요."

팀원님: "네, 그리고 메시지 API에서는 읽음 표시 기능도 추가했습니다."
```

## 5. 프론트엔드-백엔드 연동 테스트

클라이언트와 서버 간의 통신이 정상적으로 작동하는지 확인하기 위해 간단한 API 테스트를 진행했습니다.

### 5.1 서버 측 API 엔드포인트 구현

```javascript
// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.send('Server is running');
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server on port ${port}`));
```

### 5.2 클라이언트 측 API 호출 테스트

```javascript
// client/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/test')
      .then(res => setMessage(res.data))
      .catch(err => console.error('Error fetching data:', err));
  }, []);

  return (
    <div>
      <h2>Home Page</h2>
      <p>Server Response: {message || 'Loading...'}</p>
    </div>
  );
}

export default Home;
```

```
본인: "프론트엔드와 백엔드 연동 테스트를 해봤는데, API 호출이 정상적으로 작동합니다."

팀원님: "좋네요! 이제 본격적인 기능 구현을 시작할 수 있겠습니다."
```

## 6. 다음 단계 계획

현재까지 프로젝트의 기본 구조와 설정을 완료했으며, 이제 다음 단계로 넘어갈 준비가 되었습니다. 다음 단계에서는 아래와 같은 작업을 진행할 예정입니다:

1. **사용자 인증 기능 구현**
   - 회원가입 및 로그인 폼 구현
   - Firebase Authentication 연동
   - 인증 상태 관리를 위한 Context API 구현

2. **스터디 그룹 관리 기능 구현**
   - 그룹 생성 및 목록 조회 기능
   - 그룹 상세 정보 페이지
   - 참여 요청 및 승인/거절 기능

3. **스케줄 매칭 기능 구현**
   - 사용자별 가능 시간 입력 UI
   - 그룹 내 공통 가능 시간 계산 및 표시

4. **채팅 기능 구현**
   - 실시간 메시지 교환
   - 읽음 표시 기능

```
팀원님: "다음 단계는 어떻게 진행하면 좋을까요?"

본인: "첫 번째로 사용자 인증 기능을 구현하는 것이 좋을 것 같습니다. 인증은 다른 모든 기능의 기반이 되니까요."

팀원님: "동의합니다. 인증 기능을 먼저 구현하고, 그 다음에 그룹 관리 기능으로 넘어가는 것이 순서상 맞을 것 같아요."

본인: "그럼 저는 인증 관련 컴포넌트를 개발하고, 팀원님은 백엔드 API를 구현하는 방식으로 분담하면 어떨까요?"

팀원님: "좋은 생각입니다. 그렇게 진행하도록 하겠습니다!"
```

## 7. 결론

StudyBuddy 프로젝트는 현재 초기 설정 및 설계 단계를 성공적으로 완료했습니다. 프론트엔드와 백엔드의 기본 구조를 설정하고, Firebase와의 연동을 통해 데이터베이스와 인증 시스템의 기반을 마련했습니다.

프로젝트 개발 과정에서 팀원 간의 긴밀한 소통과 협업이 원활하게 이루어졌으며, 각자의 의견을 존중하면서 최선의 결정을 내리기 위해 노력했습니다.

이제 본격적인 기능 구현을 시작할 준비가 되었으며, 계획된 일정에 따라 단계적으로 개발을 진행할 예정입니다. 사용자 중심의 UI/UX를 고려하고, 기능적으로도 완성도 높은 애플리케이션을 개발하는 것을 목표로 하고 있습니다.

팀원 모두 이 프로젝트를 통해 최신 웹 개발 기술을 경험하고, 실제 서비스 개발 과정을 경험함으로써 역량을 향상시킬 수 있는 좋은 기회가 될 것으로 기대합니다.