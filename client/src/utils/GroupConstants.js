// 그룹 주제
// 그룹 주제 프로그래밍으로 통일 작업 및 유효성 검증 작업ㅎ다가ㅏ 맘
export const GROUP_SUBJECTS = ["Programming"];

// 태그 (주제별로 구분)
export const GROUP_TAGS = {
  "Programming": [
    "JavaScript", "React", "Python", "Java", "C/C++", "Android",
    "iOS", "Web Development", "Backend", "Frontend", "Database",
    "Node.js", "Vue.js", "Angular", "TypeScript", "Kotlin", "Swift",
    "Flutter", "React Native", "Mysql", "Nest.js", "Next.js",
    "Java Spring", "Spring Boot", "HTML/CSS",
    "FireBase", "Svelte", "Docker", "FullStack",
    "Algorithm"
  ]
};

// 모든 태그를 하나의 배열로 평탄화
export const ALL_TAGS = Object.values(GROUP_TAGS).flat();

// 미팅 유형
export const MEETING_TYPES = [
  "온라인",
  "오프라인",
  "혼합"
];

// 상수 유효성 검증
const validateConstants = () => {
  // 주제가 비어있지 않은지 확인
  if (GROUP_SUBJECTS.length === 0) {
    console.warn('GROUP_SUBJECTS가 비어 있습니다.');
  }
  
  // 모든 주제에 대한 태그가 정의되어 있는지 확인
  GROUP_SUBJECTS.forEach(subject => {
    if (!GROUP_TAGS[subject] || GROUP_TAGS[subject].length === 0) {
      console.warn(`주제 "${subject}"에 대한 태그가 정의되지 않았거나 비어 있습니다.`);
    }
  });
  
  // 주제에 없는 키가 GROUP_TAGS에 있는지 확인
  Object.keys(GROUP_TAGS).forEach(key => {
    if (!GROUP_SUBJECTS.includes(key)) {
      console.warn(`"${key}"는 GROUP_SUBJECTS에 없지만 GROUP_TAGS에 정의되어 있습니다.`);
    }
  });
  
  // 모든 태그가 문자열인지 확인
  Object.values(GROUP_TAGS).flat().forEach(tag => {
    if (typeof tag !== 'string') {
      console.error(`유효하지 않은 태그 형식: ${tag}는 문자열이 아닙니다.`);
    }
  });
  
  // 미팅 타입이 모두 유효한 값인지 확인
  const VALID_MEETING_TYPES = ['온라인', '오프라인', '혼합'];
  MEETING_TYPES.forEach(type => {
    if (!VALID_MEETING_TYPES.includes(type)) {
      console.error(`유효하지 않은 미팅 타입: ${type}`);
    }
  });
};

// 상수 유효성 검증 실행
validateConstants();

// 태그 검색 유틸리티 함수 (최적화)
export const hasTag = (tag) => TAGS_MAP.has(tag);
export const getTagsBySubject = (subject) => GROUP_TAGS[subject] || [];
export const isValidSubject = (subject) => GROUP_SUBJECTS.includes(subject);
export const isValidMeetingType = (type) => MEETING_TYPES.includes(type);

export default {
  GROUP_SUBJECTS,
  GROUP_TAGS,
  ALL_TAGS,
  MEETING_TYPES,
  hasTag,
  getTagsBySubject,
  isValidSubject,
  isValidMeetingType
};