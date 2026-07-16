// survey-study 전용 타입 (N9 기존 코드와 완전히 독립)

/** 응답 방식 그룹 */
export type GroupKey = "A" | "B" | "C" | "D";

/** 척도형 그룹(문구 변형이 존재하는 그룹) */
export type ScaleGroupKey = "A" | "B" | "C";

/** 문항 정의 — id가 곧 구성개념 번호(1~8, 응답자 비노출) */
export interface Question {
  id: number; // 1~8 (constructIndex)
  /** 구성개념 이름 — 관리자 대시보드 전용 표시 (응답자 비노출) */
  construct: string;
  /** 그룹별로 자연스럽게 다르게 표현한 진술문 (같은 것을 묻는 티가 나지 않게) */
  variants: Record<ScaleGroupKey, string>;
  /** D 그룹(척도 없음)에서 사용되는 완전한 서술형 질문 문장 */
  descriptive: string;
}

/** 한 그룹의 척도 방식 정의 */
export interface GroupConfig {
  key: GroupKey;
  label: string; // 관리자용 표시 이름
  /** 척도 유형 */
  kind: "scale5" | "scale4" | "slider100" | "openText";
  /** 척도 최소/최대 (openText 그룹은 사용 안 함) */
  min?: number;
  max?: number;
  /** 좌/우 끝 라벨 */
  leftLabel?: string;
  rightLabel?: string;
  /** 각 선택지 아래 표시할 라벨 (scale5/scale4 전용) */
  pointLabels?: string[];
  /** 척도 응답 뒤에 이유 서술을 받을지 여부 */
  askReason: boolean;
}

/** 한 세션(응답자 1명) */
export interface SurveySession {
  id: string;
  group: GroupKey;
  started_at: string; // ISO
  completed_at: string | null;
  grade: string | null; // 학년 (선택)
  affiliation: string | null; // 소속 (선택)
  created_at?: string;
}

/** 문항 하나에 대한 응답 */
export interface SurveyResponse {
  id?: string;
  session_id: string;
  question_id: number;
  /** 척도 점수. 결측(건너뜀)이거나 D그룹이면 null */
  value: number | null;
  /** 이유 서술(A/B/C) 또는 D그룹 서술 응답 */
  reason_text: string | null;
  /** D그룹 서술 응답에 관리자가 부여한 수동 코드(1~5). 미코딩이면 null */
  manual_code?: number | null;
  /** 이 문항에 걸린 응답 소요시간(ms) */
  duration_ms: number | null;
  answered_at: string; // ISO
  created_at?: string;
}

/** 대시보드에서 세션 + 응답을 합친 형태 */
export interface SessionWithResponses extends SurveySession {
  responses: SurveyResponse[];
}
