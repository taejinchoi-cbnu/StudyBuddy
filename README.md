# StudyBuddy

StudyBuddy는 학생들이 스터디 그룹을 쉽게 만들고 참여하며, 일정을 조율하고 실시간으로 소통할 수 있는 웹 애플리케이션입니다.

## 기능

- 사용자 인증: 회원가입, 로그인, 로그아웃
- 스터디 그룹 관리: 생성, 검색, 참여 요청, 승인/거절
- 스케줄 매칭: 구성원 간 공통 가능 시간 찾기
- 실시간 그룹 채팅: 텍스트 기반 메시지 교환
- 사용자 프로필: 기본 정보 설정 및 참여 그룹 확인

## 기술 스택

- **프론트엔드**: Vite + React, Bootstrap, React Router
- **백엔드**: Node.js, Express
- **데이터베이스**: Firebase (Authentication, Firestore)
- **기타**: Git, GitHub

## 설치 및 실행 방법

1. 저장소를 클론합니다.
git clone https://github.com/taejinchoi-cbnu/StudyBuddy.git
cd StudyBuddy

2. 환경 변수를 설정합니다.
클라이언트 측
```bash
cd client
cp .env.example .env
```
.env 파일 내용 수정 (Firebase API 키 등)

서버 측
```bash
cd ../server
cp .env.example .env
```
.env 파일 내용 수정

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
```text
StudyBuddy/
├── client/                # 프론트엔드 (React + Vite)
│   └── src/
│       ├── components/    # 재사용 가능한 UI 컴포넌트
│       ├── pages/         # 페이지 컴포넌트
│       ├── services/      # API 호출 로직
│       ├── context/       # 상태 관리
│       ├── utils/         # 유틸리티 함수
│       └── firebase.js    # Firebase 설정
│
└── server/                # 백엔드 (Node.js + Express)
├── controllers/       # API 컨트롤러
├── middleware/        # 미들웨어
├── routes/            # API 라우트
├── config/            # 설정 파일
└── server.js          # 메인 서버 파일
```

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 브랜치를 생성합니다: `git checkout -b feature/my-feature`
3. 변경사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 원격 브랜치에 푸시합니다: `git push origin feature/my-feature`
5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.