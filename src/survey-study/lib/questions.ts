import type { GroupConfig, GroupKey, Question } from "./types";

/**
 * [내부 문서 — 응답자 화면에는 절대 노출하지 않음]
 *
 * 연구 주제: 응답 척도 형식에 따른 변별력·타당도 비교
 * - A: 5점 리커트(중간값 "보통이다" 포함) → 중심화 경향 가설
 * - B: 4점 리커트(중간값 없음, 강제선택)
 * - C: 0~100 슬라이더 → heaping(특정 숫자 몰림) 가설
 * - D: 개방형 서술 → 준거값 산출용
 *
 * 8개 구성개념(만족도)을 네 그룹이 동일하게 응답하되,
 * 그룹별 문구는 자연스럽게 다르게 표현한다(문항 위장 원칙).
 * 문항 제시 순서도 그룹마다 다르다(QUESTION_ORDER).
 */

export const QUESTIONS: Question[] = [
  {
    id: 1,
    construct: "전반적 생활 만족도",
    variants: {
      A: "나는 요즘 학교(기관) 생활에 전반적으로 만족한다.",
      B: "요즘 하루하루 생활이 대체로 만족스럽다.",
      C: "요즘 나의 전반적인 생활에 만족하는 편이다.",
    },
    descriptive:
      "요즘 학교(기관) 생활이 전반적으로 어떤가요? 느끼는 그대로 자유롭게 적어 주세요.",
  },
  {
    id: 2,
    construct: "식사(급식) 만족도",
    variants: {
      A: "나는 급식(식사)에 만족하는 편이다.",
      B: "요즘 나오는 식사(급식)가 입에 잘 맞는다.",
      C: "학교(기관)에서 먹는 밥은 대체로 만족스럽다.",
    },
    descriptive:
      "학교(기관)에서의 식사(급식)는 어떤가요? 좋았던 점이나 아쉬운 점을 자유롭게 적어 주세요.",
  },
  {
    id: 3,
    construct: "활동/수업 집중도 만족도",
    variants: {
      A: "나는 수업이나 활동에 집중이 잘 된다.",
      B: "수업(활동) 시간에 몰입해서 참여하는 편이다.",
      C: "수업이나 프로그램 시간에 집중하기 좋다고 느낀다.",
    },
    descriptive:
      "수업이나 활동 시간에 집중이 잘 되는 편인가요? 평소 모습을 자유롭게 적어 주세요.",
  },
  {
    id: 4,
    construct: "디지털 도구(앱/기기) 활용 만족도",
    variants: {
      A: "나는 수업·활동에서 쓰는 앱이나 기기가 편리하다고 느낀다.",
      B: "학교(기관)에서 사용하는 디지털 기기(앱)가 나에게 도움이 된다.",
      C: "앱이나 기기를 활용하는 시간이 만족스러운 편이다.",
    },
    descriptive:
      "수업이나 활동에서 앱·기기를 사용할 때 어떤가요? 편한 점이나 불편한 점을 자유롭게 적어 주세요.",
  },
  {
    id: 5,
    construct: "여가 활동 시간 만족도",
    variants: {
      A: "나는 여가 시간(자유 시간)이 충분하다고 느낀다.",
      B: "쉬거나 놀 수 있는 자유 시간에 만족한다.",
      C: "하루 중 내 마음대로 쓸 수 있는 시간에 만족하는 편이다.",
    },
    descriptive:
      "하루 중 자유롭게 쓰는 시간은 어느 정도인가요? 충분한지, 부족한지 자유롭게 적어 주세요.",
  },
  {
    id: 6,
    construct: "행사(모임/축제) 만족도",
    variants: {
      A: "나는 학교(기관) 행사(축제·모임 등)가 즐겁다.",
      B: "축제나 모임 같은 행사에 참여하는 것이 만족스럽다.",
      C: "우리 학교(기관)의 행사는 기대되는 편이다.",
    },
    descriptive:
      "최근에 참여했던 행사(축제, 모임 등)는 어땠나요? 기억에 남는 점을 자유롭게 적어 주세요.",
  },
  {
    id: 7,
    construct: "휴식/수면 만족도",
    variants: {
      A: "나는 잠을 충분히 자고 몸이 개운한 편이다.",
      B: "요즘 휴식과 수면이 충분하다고 느낀다.",
      C: "자고 일어나면 피로가 잘 풀리는 편이다.",
    },
    descriptive:
      "요즘 잠은 잘 자고 있나요? 휴식이 충분한지 평소 상태를 자유롭게 적어 주세요.",
  },
  {
    id: 8,
    construct: "대인관계(친구/동료) 만족도",
    variants: {
      A: "나는 친구(동료)들과의 관계에 만족한다.",
      B: "주변 사람들과 잘 지내고 있다고 느낀다.",
      C: "친구나 동료와 함께 있는 시간이 편안하다.",
    },
    descriptive:
      "친구(동료)들과의 관계는 어떤가요? 요즘 느끼는 점을 자유롭게 적어 주세요.",
  },
];

/**
 * 그룹별 문항 제시 순서 (문항 위장 원칙 — 순서·배치도 그룹마다 다르게).
 * 숫자는 QUESTIONS의 id(구성개념 번호).
 */
export const QUESTION_ORDER: Record<GroupKey, number[]> = {
  A: [1, 3, 5, 2, 7, 4, 8, 6],
  B: [2, 6, 1, 4, 8, 3, 5, 7],
  C: [5, 1, 8, 6, 3, 7, 2, 4],
  D: [3, 8, 2, 5, 1, 7, 6, 4],
};

/** 그룹의 제시 순서대로 문항 배열 반환 */
export function orderedQuestions(group: GroupKey): Question[] {
  return QUESTION_ORDER[group].map(
    (id) => QUESTIONS.find((q) => q.id === id)!
  );
}

export const GROUPS: Record<GroupKey, GroupConfig> = {
  A: {
    key: "A",
    label: "A그룹 · 5점 척도",
    kind: "scale5",
    min: 1,
    max: 5,
    leftLabel: "전혀 그렇지 않다",
    rightLabel: "매우 그렇다",
    pointLabels: [
      "전혀 그렇지 않다",
      "그렇지 않다",
      "보통이다",
      "그렇다",
      "매우 그렇다",
    ],
    askReason: true,
  },
  B: {
    key: "B",
    label: "B그룹 · 4점 척도(중간값 없음)",
    kind: "scale4",
    min: 1,
    max: 4,
    leftLabel: "전혀 그렇지 않다",
    rightLabel: "매우 그렇다",
    pointLabels: [
      "전혀 그렇지 않다",
      "그렇지 않은 편이다",
      "그런 편이다",
      "매우 그렇다",
    ],
    askReason: true,
  },
  C: {
    key: "C",
    label: "C그룹 · 0~100 슬라이더",
    kind: "slider100",
    min: 0,
    max: 100,
    leftLabel: "전혀 그렇지 않다",
    rightLabel: "매우 그렇다",
    askReason: true,
  },
  D: {
    key: "D",
    label: "D그룹 · 서술형(척도 없음)",
    kind: "openText",
    askReason: false, // 문항 자체가 서술형이므로 별도 이유 칸 없음
  },
};

export const GROUP_KEYS: GroupKey[] = ["A", "B", "C", "D"];

/** 링크 하나로 배포 시 응답자가 알 수 없게 무작위 그룹 배정 */
export function assignRandomGroup(): GroupKey {
  const i = Math.floor(Math.random() * GROUP_KEYS.length);
  return GROUP_KEYS[i];
}
