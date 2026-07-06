import { GROUP_KEYS, QUESTIONS } from "./questions";
import {
  centralTendency,
  mean,
  missingRate,
  normalizeToPercent,
  sampleStd,
  sampleVariance,
} from "./stats";
import type { GroupKey, SessionWithResponses } from "./types";

export interface CellStats {
  group: GroupKey;
  questionId: number;
  n: number; // 유효(비결측) 응답 수
  attempts: number; // 해당 문항 응답 시도 총수(결측 포함)
  rawMean: number | null;
  rawStd: number | null;
  rawVar: number | null;
  normMean: number | null; // 0~100 정규화 평균
  normStd: number | null; // 0~100 정규화 표본표준편차
  centralIndex: number | null; // 중앙집중도(%)
  centralRef: number | null; // B그룹 참고 지표(%)
  centralNote: string;
  avgSeconds: number | null; // 평균 응답 소요시간(초)
  missingPct: number; // 결측 비율(%)
}

export interface Aggregate {
  /** [questionId][group] -> CellStats */
  cells: Record<number, Record<GroupKey, CellStats>>;
  /** 그룹별 완료 세션 수 */
  groupCounts: Record<GroupKey, number>;
  /** 그룹별 전체 세션 수(미완료 포함) */
  groupTotals: Record<GroupKey, number>;
  totalSessions: number;
  completedSessions: number;
}

export function computeAggregate(sessions: SessionWithResponses[]): Aggregate {
  const groupCounts = { A: 0, B: 0, C: 0, D: 0 } as Record<GroupKey, number>;
  const groupTotals = { A: 0, B: 0, C: 0, D: 0 } as Record<GroupKey, number>;
  let completedSessions = 0;

  for (const s of sessions) {
    groupTotals[s.group] += 1;
    if (s.completed_at) {
      groupCounts[s.group] += 1;
      completedSessions += 1;
    }
  }

  const cells: Record<number, Record<GroupKey, CellStats>> = {};

  for (const q of QUESTIONS) {
    cells[q.id] = {} as Record<GroupKey, CellStats>;
    for (const g of GROUP_KEYS) {
      // 이 그룹의 세션들에서 이 문항의 응답 행 수집
      const rows = sessions
        .filter((s) => s.group === g)
        .map((s) => s.responses.find((r) => r.question_id === q.id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r));

      const values = rows.map((r) => r.value);
      const norm = values
        .map((v) => normalizeToPercent(g, v))
        .filter((v): v is number => v !== null);
      const durations = rows
        .map((r) => r.duration_ms)
        .filter((d): d is number => typeof d === "number" && d > 0);

      const ct = centralTendency(g, values);
      const validCount = values.filter(
        (v) => typeof v === "number" && Number.isFinite(v)
      ).length;

      cells[q.id][g] = {
        group: g,
        questionId: q.id,
        n: validCount,
        attempts: rows.length,
        rawMean: mean(values),
        rawStd: sampleStd(values),
        rawVar: sampleVariance(values),
        normMean: norm.length ? mean(norm) : null,
        normStd: norm.length >= 2 ? sampleStd(norm) : null,
        centralIndex: ct.index,
        centralRef: ct.reference,
        centralNote: ct.note,
        avgSeconds: durations.length
          ? durations.reduce((a, b) => a + b, 0) / durations.length / 1000
          : null,
        missingPct: rows.length ? missingRate(values) : 0,
      };
    }
  }

  return {
    cells,
    groupCounts,
    groupTotals,
    totalSessions: sessions.length,
    completedSessions,
  };
}
