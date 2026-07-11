"use client";

import { useEffect, useMemo, useState } from "react";
import GroupedBarChart, {
  type BarSeries,
} from "@/survey-study/components/GroupedBarChart";
import QrCode from "@/survey-study/components/QrCode";
import { GROUPS, GROUP_KEYS, QUESTIONS } from "@/survey-study/lib/questions";
import { fetchAllSessions } from "@/survey-study/lib/db";
import { computeAggregate } from "@/survey-study/lib/aggregate";
import { keywordFrequency, round } from "@/survey-study/lib/stats";
import { downloadCsv, toCsv } from "@/survey-study/lib/csv";
import type { GroupKey, SessionWithResponses } from "@/survey-study/lib/types";

const GROUP_COLOR: Record<GroupKey, string> = {
  A: "#6366f1", // indigo
  B: "#10b981", // emerald
  C: "#f59e0b", // amber
};

// 정규화 비교/표준편차 차트에는 수치가 있는 A/B/C만 사용
const NUM_GROUPS: GroupKey[] = ["A", "B", "C"];

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionWithResponses[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [present, setPresent] = useState(false); // 발표용 보기 모드
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllSessions();
      setSessions(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "데이터를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    load();
  }, []);

  const agg = useMemo(
    () => (sessions ? computeAggregate(sessions) : null),
    [sessions]
  );

  // 이유/서술 텍스트 그룹별 키워드
  const keywordsByGroup = useMemo(() => {
    if (!sessions) return null;
    const out = {} as Record<GroupKey, { word: string; freq: number }[]>;
    for (const g of GROUP_KEYS) {
      const texts = sessions
        .filter((s) => s.group === g)
        .flatMap((s) => s.responses.map((r) => r.reason_text));
      out[g] = keywordFrequency(texts, 12);
    }
    return out;
  }, [sessions]);

  // 정규화 평균 비교 차트 (문항 x 그룹)
  const normMeanSeries: BarSeries[] = useMemo(() => {
    if (!agg) return [];
    return NUM_GROUPS.map((g) => ({
      key: g,
      label: GROUPS[g].label,
      color: GROUP_COLOR[g],
      values: QUESTIONS.map((q) => {
        const v = agg.cells[q.id][g].normMean;
        return v === null ? null : Math.round(v * 10) / 10;
      }),
    }));
  }, [agg]);

  // 정규화 표준편차 비교 차트
  const normStdSeries: BarSeries[] = useMemo(() => {
    if (!agg) return [];
    return NUM_GROUPS.map((g) => ({
      key: g,
      label: GROUPS[g].label,
      color: GROUP_COLOR[g],
      values: QUESTIONS.map((q) => {
        const v = agg.cells[q.id][g].normStd;
        return v === null ? null : Math.round(v * 10) / 10;
      }),
    }));
  }, [agg]);

  const handleCsv = () => {
    if (!sessions) return;
    downloadCsv("survey-study-data.csv", toCsv(sessions));
  };

  const categories = QUESTIONS.map((q) => `Q${q.id}`);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        데이터를 불러오는 중…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            연구자 대시보드
          </h1>
          <p className="text-sm text-slate-500">
            설문 응답 방식에 따른 응답 편향 비교
          </p>
        </div>

        {/* 관리 버튼 — 발표 모드에서는 숨김 */}
        {!present && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={load}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              새로고침
            </button>
            <button
              onClick={handleCsv}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              CSV 다운로드
            </button>
            <button
              onClick={() => setShowQr((v) => !v)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              배포용 QR
            </button>
          </div>
        )}
        <button
          onClick={() => setPresent((v) => !v)}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            present
              ? "bg-slate-800 text-white"
              : "border border-indigo-300 text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          {present ? "발표 모드 끄기" : "발표용 보기 모드"}
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error} — Supabase에 <code>survey_sessions</code> /{" "}
          <code>survey_responses</code> 테이블이 생성되어 있는지 확인하세요.
        </p>
      )}

      {/* QR */}
      {showQr && !present && origin && (
        <div className="mb-6 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6">
          <p className="mb-3 text-sm font-medium text-slate-600">
            아래 QR/링크를 공유하면 응답자에게 자동으로 그룹이 무작위 배정됩니다.
          </p>
          <QrCode text={`${origin}/survey-study`} />
        </div>
      )}

      {/* 개요 카드 */}
      {agg && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="전체 세션" value={agg.totalSessions} />
          <StatCard label="완료" value={agg.completedSessions} accent />
          {GROUP_KEYS.map((g) => (
            <StatCard
              key={g}
              label={`${g}그룹 완료`}
              value={agg.groupCounts[g]}
              color={GROUP_COLOR[g]}
            />
          ))}
        </div>
      )}

      {/* 정규화 평균 비교 */}
      <Section
        title="① 그룹 간 평균 비교 (0~100 정규화)"
        desc="척도 범위가 다르므로 A(1~5)·B(1~4)·C(0~100)를 모두 0~100으로 정규화한 평균입니다."
      >
        <GroupedBarChart
          categories={categories}
          series={normMeanSeries}
          yMax={100}
          yLabel="정규화 평균 (0~100)"
          unit=""
        />
      </Section>

      {/* 표준편차 비교 */}
      <Section
        title="② 그룹 간 응답 분산(표준편차) 비교"
        desc="정규화(0~100)한 값의 표본표준편차(n-1)입니다. 값이 작을수록 응답이 중앙으로 몰렸음(중심화 경향)을 의미합니다."
      >
        <GroupedBarChart
          categories={categories}
          series={normStdSeries}
          yMax={50}
          yLabel="정규화 표본표준편차"
          unit=""
        />
      </Section>

      {/* 문항별 기술통계 테이블 */}
      <Section
        title="③ 문항별·그룹별 기술통계"
        desc="모든 통계 옆에 유효 표본수 n을 함께 표시합니다. 표준편차는 표본표준편차(n-1)."
      >
        <div className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Q{q.id}. {q.statement}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                      <th className="py-2 pr-3">그룹</th>
                      <th className="py-2 pr-3">n</th>
                      <th className="py-2 pr-3">평균(원점수)</th>
                      <th className="py-2 pr-3">표준편차</th>
                      <th className="py-2 pr-3">분산</th>
                      <th className="py-2 pr-3">중앙집중도</th>
                      <th className="py-2 pr-3">평균응답(초)</th>
                      <th className="py-2 pr-3">결측%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agg &&
                      GROUP_KEYS.map((g) => {
                        const c = agg.cells[q.id][g];
                        return (
                          <tr
                            key={g}
                            className="border-b border-slate-100 text-slate-700"
                          >
                            <td className="py-2 pr-3 font-medium">
                              <span
                                className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-middle"
                                style={{ backgroundColor: GROUP_COLOR[g] }}
                              />
                              {g}
                            </td>
                            <td className="py-2 pr-3">{c.n}</td>
                            <td className="py-2 pr-3">{fmt(c.rawMean)}</td>
                            <td className="py-2 pr-3">{fmt(c.rawStd)}</td>
                            <td className="py-2 pr-3">{fmt(c.rawVar)}</td>
                            <td className="py-2 pr-3">
                              {g === "B" ? (
                                <span title={c.centralNote}>
                                  <span className="text-slate-400">
                                    정의 안 됨
                                  </span>
                                  {c.centralRef !== null && (
                                    <span className="ml-1 text-xs text-slate-500">
                                      (참고 {fmt(c.centralRef, 1)}%)
                                    </span>
                                  )}
                                </span>
                              ) : c.centralIndex !== null ? (
                                <span title={c.centralNote}>
                                  {fmt(c.centralIndex, 1)}%
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-2 pr-3">{fmt(c.avgSeconds, 1)}</td>
                            <td className="py-2 pr-3">
                              {fmt(c.missingPct, 1)}%
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 키워드 빈도 */}
      <Section
        title="④ 이유·서술 텍스트 키워드 빈도"
        desc="A/B/C 그룹의 '이유' 서술에서 자주 등장한 단어입니다. 정량(점수)과 정성(이유)을 비교하는 데 사용합니다."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {keywordsByGroup &&
            GROUP_KEYS.map((g) => (
              <div
                key={g}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: GROUP_COLOR[g] }}
                  />
                  {g}그룹
                </div>
                {keywordsByGroup[g].length === 0 ? (
                  <p className="text-xs text-slate-400">데이터 없음</p>
                ) : (
                  <ul className="space-y-1">
                    {keywordsByGroup[g].map((k) => (
                      <li
                        key={k.word}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-600">{k.word}</span>
                        <span className="font-mono text-xs text-slate-400">
                          {k.freq}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      </Section>

      {!present && (
        <p className="mt-10 text-center text-xs text-slate-400">
          응답 링크: {origin}/survey-study · 대시보드는 발표용 보기 모드로
          관리 버튼을 숨길 수 있습니다.
        </p>
      )}
    </main>
  );
}

function fmt(v: number | null, digits = 2): string {
  const r = round(v, digits);
  return r === null ? "—" : String(r);
}

function StatCard({
  label,
  value,
  accent,
  color,
}: {
  label: string;
  value: number;
  accent?: boolean;
  color?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className="text-2xl font-bold"
        style={{ color: color ?? (accent ? "#4f46e5" : "#0f172a") }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {desc && <p className="mb-4 mt-1 text-sm text-slate-500">{desc}</p>}
      {children}
    </section>
  );
}
