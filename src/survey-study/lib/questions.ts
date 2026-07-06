import type { GroupConfig, GroupKey, Question } from "./types";

/**
 * 연구 주제: "설문 응답 방식에 따른 응답 편향(Bias) 분석"
 * 핵심 질문: "5점 척도는 정말 중심화 경향(Central Tendency Bias)을 만드는가?"
 *
 * 동일한 8개의 진술문을 네 가지 응답 방식(A/B/C/D)으로 제시해
 * 응답 분포의 차이를 비교한다.
 */

export const QUESTIONS: Question[] = [
  {
    id: 1,
    statement: "나는 평소 수업 시간에 집중을 잘하는 편이다.",
    descriptive:
      "당신은 평소 수업 시간에 얼마나 집중하는 편인가요? 그렇게 생각하는 이유와 함께 자유롭게 서술해 주세요.",
  },
  {
    id: 2,
    statement: "나는 새로운 것을 배우는 것을 좋아한다.",
    descriptive:
      "당신은 새로운 것을 배우는 것에 대해 어떻게 느끼나요? 그 이유와 함께 자유롭게 서술해 주세요.",
  },
  {
    id: 3,
    statement: "나는 어려운 문제를 만나도 포기하지 않고 끝까지 해결하려 한다.",
    descriptive:
      "어려운 문제를 마주했을 때 당신은 보통 어떻게 하나요? 실제 경험과 함께 자유롭게 서술해 주세요.",
  },
  {
    id: 4,
    statement: "나는 친구들과 협력하여 과제를 하는 것을 선호한다.",
    descriptive:
      "과제를 할 때 혼자 하는 것과 친구와 함께하는 것 중 무엇을 선호하나요? 이유와 함께 서술해 주세요.",
  },
  {
    id: 5,
    statement: "나는 계획을 세워서 규칙적으로 공부하는 편이다.",
    descriptive:
      "당신은 공부 계획을 세우고 규칙적으로 실천하는 편인가요? 자신의 공부 습관을 자유롭게 서술해 주세요.",
  },
  {
    id: 6,
    statement: "나는 발표나 토론에 적극적으로 참여한다.",
    descriptive:
      "수업 중 발표나 토론에 당신은 얼마나 적극적으로 참여하나요? 그 이유와 함께 서술해 주세요.",
  },
  {
    id: 7,
    statement: "나는 실수를 하더라도 크게 신경 쓰지 않는 편이다.",
    descriptive:
      "실수를 했을 때 당신은 보통 어떻게 반응하나요? 자신의 성향을 자유롭게 서술해 주세요.",
  },
  {
    id: 8,
    statement: "나는 스마트폰 사용 시간을 스스로 잘 조절한다.",
    descriptive:
      "당신은 스마트폰 사용 시간을 스스로 얼마나 잘 조절하나요? 실제 습관과 함께 서술해 주세요.",
  },
];

export const GROUPS: Record<GroupKey, GroupConfig> = {
  A: {
    key: "A",
    label: "A그룹 · 5점 척도",
    kind: "scale5",
    min: 1,
    max: 5,
    leftLabel: "전혀 그렇지 않다",
    rightLabel: "매우 그렇다",
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
