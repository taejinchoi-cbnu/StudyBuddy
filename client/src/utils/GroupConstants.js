// 그룹 주제
export const GROUP_SUBJECTS = [
  "Programming",
  "Design"
];

// 태그 (주제별로 구분)
export const GROUP_TAGS = {
  "Programming": [
    "JavaScript", "React", "Python", "Java", "C/C++", "Android",
    "iOS", "Web Development", "Backend", "Frontend", "Database",
    "Node.js", "Vue.js", "Angular", "TypeScript", "Kotlin", "Swift",
    "Flutter", "React Native", "DevOps", "Cloud", "AWS",
    "Google Cloud", "Azure", "Machine Learning", "Artificial Intelligence",
    "Blockchain", "Game Development", "Unity", "Unreal Engine",
    "Embedded Systems", "Cybersecurity"
  ],
  "Design": [
    "UI/UX", "Graphic Design", "Web Design", "Illustration", "Photoshop",
    "3D Modeling", "Animation",
    "Motion Graphics", "Prototyping", "Figma", "Sketch", "Adobe XD",
    "Branding", "Typography", "Packaging Design", "Interior Design",
    "Fashion Design", "Game Art", "Character Design", "VR/AR Design",
    "Data Visualization", "Infographics"
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