import type { GroupKey } from "./types";

/** 결측치(null/NaN)를 제외한 유효 숫자만 추출 */
export function validNumbers(values: (number | null | undefined)[]): number[] {
  return values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v)
  );
}

/** 산술 평균 (결측 제외). n=0이면 null */
export function mean(values: (number | null | undefined)[]): number | null {
  const xs = validNumbers(values);
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * 표본표준편차 (n-1 분모, 표본표준편차).
 * n<2 이면 계산 불가 → null.
 */
export function sampleStd(values: (number | null | undefined)[]): number | null {
  const xs = validNumbers(values);
  const n = xs.length;
  if (n < 2) return null;
  const m = xs.reduce((a, b) => a + b, 0) / n;
  const ss = xs.reduce((acc, x) => acc + (x - m) ** 2, 0);
  return Math.sqrt(ss / (n - 1));
}

/** 표본분산 (n-1 분모) */
export function sampleVariance(
  values: (number | null | undefined)[]
): number | null {
  const s = sampleStd(values);
  return s === null ? null : s * s;
}

/** 중앙값(median) — 참고용 */
export function median(values: (number | null | undefined)[]): number | null {
  const xs = validNumbers(values).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 === 0 ? (xs[mid - 1] + xs[mid]) / 2 : xs[mid];
}

/** 유효 응답 수 */
export function count(values: (number | null | undefined)[]): number {
  return validNumbers(values).length;
}

/** 분위수 (선형보간). q=0.25 → 1사분위, q=0.75 → 3사분위. n=0이면 null */
export function quantile(
  values: (number | null | undefined)[],
  q: number
): number | null {
  const xs = validNumbers(values).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  if (xs.length === 1) return xs[0];
  const pos = (xs.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = xs[base + 1];
  return next === undefined ? xs[base] : xs[base] + rest * (next - xs[base]);
}

/** 사분위 범위(IQR) = Q3 − Q1. 변별력(퍼짐) 지표 */
export function iqr(values: (number | null | undefined)[]): number | null {
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  return q1 === null || q3 === null ? null : q3 - q1;
}

/** 결측 비율(%) — 전체 시도 중 값이 없는 비율 */
export function missingRate(
  values: (number | null | undefined)[]
): number {
  if (values.length === 0) return 0;
  const missing = values.length - validNumbers(values).length;
  return (missing / values.length) * 100;
}

/**
 * 중앙값 집중도 지수 (Central Tendency Index).
 * - A그룹(1~5): 정확히 3점을 고른 응답 비율(%)
 * - B그룹(1~4): 중간값이 없으므로 "정의되지 않음"(null).
 *              대신 참고 지표로 2점+3점 비율(%)을 함께 제공.
 * - C그룹(0~100): 40~60 구간(포함) 응답 비율(%)
 * - D그룹: 척도 없음 → null
 */
export interface CentralTendency {
  /** 대표 지수(%) — B/D는 null */
  index: number | null;
  /** B그룹 참고 지표: 2점+3점 비율(%) */
  reference: number | null;
  /** 사람이 읽는 설명 */
  note: string;
}

export function centralTendency(
  group: GroupKey,
  values: (number | null | undefined)[]
): CentralTendency {
  const xs = validNumbers(values);
  const n = xs.length;
  if (n === 0) {
    return { index: null, reference: null, note: "응답 없음" };
  }
  switch (group) {
    case "A": {
      const mid = xs.filter((v) => v === 3).length;
      return {
        index: (mid / n) * 100,
        reference: null,
        note: "3점(중앙) 응답 비율",
      };
    }
    case "B": {
      const midish = xs.filter((v) => v === 2 || v === 3).length;
      return {
        index: null,
        reference: (midish / n) * 100,
        note: "중간값 없음(정의되지 않음) · 참고: 2·3점 비율",
      };
    }
    case "C": {
      const mid = xs.filter((v) => v >= 40 && v <= 60).length;
      return {
        index: (mid / n) * 100,
        reference: null,
        note: "40~60 구간 응답 비율",
      };
    }
    case "D":
    default:
      return { index: null, reference: null, note: "척도 없음" };
  }
}

/**
 * 그룹 간 비교를 위해 원점수를 0~100으로 정규화.
 * - A(1~5): (v-1)/4*100
 * - B(1~4): (v-1)/3*100
 * - C(0~100): 그대로
 * - D: 척도 없음 → null
 */
export function normalizeToPercent(
  group: GroupKey,
  value: number | null | undefined
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  switch (group) {
    case "A":
      return ((value - 1) / 4) * 100;
    case "B":
      return ((value - 1) / 3) * 100;
    case "C":
      return value;
    case "D":
    default:
      return null;
  }
}

/** 소수 반올림 헬퍼 (표시용). null 안전. */
export function round(v: number | null, digits = 2): number | null {
  if (v === null || !Number.isFinite(v)) return null;
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

/**
 * 이유 텍스트 키워드 빈도.
 * 한글 조사/불용어를 간단히 제거하고 2글자 이상 토큰의 빈도를 센다.
 */
const STOPWORDS = new Set([
  "그리고","그래서","하지만","그런데","그냥","정말","조금","약간","때문","때문에",
  "생각","생각한다","같다","같아서","것","수","좀","되게","너무","매우","아주",
  "저는","나는","제가","내가","그것","이것","그거","이거","합니다","한다","해서",
  "있다","없다","있어서","없어서","되다","된다","이다","입니다","거의","항상",
]);

export function keywordFrequency(
  texts: (string | null | undefined)[],
  topN = 20
): { word: string; freq: number }[] {
  const counts = new Map<string, number>();
  for (const t of texts) {
    if (!t) continue;
    // 한글/영문/숫자만 남기고 분리
    const tokens = t
      .replace(/[^가-힣a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
    for (const w of tokens) {
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, freq]) => ({ word, freq }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, topN);
}
