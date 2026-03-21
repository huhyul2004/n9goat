export const SCHOOLS = [
  "신정중학교",
  "신일중학교",
  "학성중학교",
  "월평중학교",
  "동평중학교",
  "태화중학교",
  "울산강남중학교",
  "옥동중학교",
  "울산중앙중학교",
  "문수중학교",
  "울산서여자중학교",
  "야음중학교",
  "옥현중학교",
  "삼호중학교",
  "대현중학교",
  "무거중학교",
] as const;

export const ROLES = [
  "교육감",
  "교장",
  "교감",
  "개발자",
  "학생부장",
  "선생님",
  "학생회",
] as const;

export const ANNOUNCEMENT_ROLES: string[] = ["교육감", "교장", "교감", "개발자"];

// 글 삭제 권한이 있는 직책 (본인 글은 누구나 삭제 가능)
export const DELETE_ROLES: string[] = ["교육감", "교장", "개발자"];

export type School = (typeof SCHOOLS)[number];
export type Role = (typeof ROLES)[number];
