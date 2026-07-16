"use client";

import { useEffect, useMemo, useState } from "react";
import GroupedBarChart, {
  type BarSeries,
} from "@/survey-study/components/GroupedBarChart";
import QrCode from "@/survey-study/components/QrCode";
import { GROUPS, GROUP_KEYS, QUESTIONS } from "@/survey-study/lib/questions";
import { fetchAllSessions, updateManualCode } from "@/survey-study/lib/db";
import {
  computeAggregate,
  DEFAULT_D_CODE_MAP,
} from "@/survey-study/lib/aggregate";
import { keywordFrequency, round, validNumbers } from "@/survey-study/lib/stats";
import { downloadCsv, toCsv } from "@/survey-study/lib/csv";
import type {
  GroupKey,
  SessionWithResponses,
  SurveyResponse,
} from "@/survey-study/lib/types";

const GROUP_COLOR: Record<GroupKey, string> = {
  A: "#6366f1", // indigo
  B: "#10b981", // emerald
  C: "#f59e0b", // amber
  D: "#94a3b8", // slate (서술형 → 수동 코딩)
};

const AUTH_KEY = "survey-study:admin";
const DMAP_KEY = "survey-study:dmap";

export default function DashboardPage() {
  // ---- 비밀번호 게이트 ----
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authing, setAuthing] = useState(false);

  const [sessions, setSessions] = useState<SessionWithResponses[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [present, setPresent] = useState(false); // 발표용 보기 모드
  const [showQr, setShowQr] = useState(false);
  const [origin, setOrigin] = useState("");

  // D그룹 수동 코드 → 0~100 매핑 (관리자가 직접 정의, localStorage 보존)
  const [dMap, setDMap] = useState<Record<number, number>>(DEFAULT_D_CODE_MAP);
  const [savingCodeId, setSavingCodeId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
    setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
    setAuthChecked(true);
    try {
      const raw = localStorage.getItem(DMAP_KEY);
      if (raw) setDMap({ ...DEFAULT_D_CODE_MAP, ...JSON.parse(raw) });
    } catch {
      // 무시 — 기본 매핑 사용
    }
  }, []);

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
    if (authed) load();
  }, [authed]);

  const submitPassword = async () => {
    setAuthing(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/survey-study/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(AUTH_KEY, "1");
        setAuthed(true);
      } else {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setAuthError(
          body?.error ?? "비밀번호가 일치하지 않습니다. 다시 입력해 주세요."
        );
      }
    } catch {
      setAuthError("확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAuthing(false);
    }
  };

  const setDMapValue = (code: number, v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setDMap((prev) => {
      const next = { ...prev, [code]: clamped };
      try {
        localStorage.setItem(DMAP_KEY, JSON.stringify(next));
      } catch {
        // 저장 실패해도 화면 동작에는 지장 없음
      }
      return next;
    });
  };

  const codeResponse = async (responseId: string, code: number | null) => {
    setSavingCodeId(responseId);
    const res = await updateManualCode(responseId, code);
    if (res.ok) {
      setSessions((prev) =>
        prev
          ? prev.map((s) => ({
              ...s,
              responses: s.responses.map((r) =>
                r.id === responseId ? { ...r, manual_code: code } : r
              ),
            }))
          : prev
      );
    }
    setSavingCodeId(null);
  };

  const agg = useMemo(
    () => (sessions ? computeAggregate(sessions, dMap) : null),
    [sessions, dMap]
  );

  // 그룹별 완주율·평균 소요시간
  const groupSummary = useMemo(() => {
    if (!sessions) return null;
    const out = {} as Record<
      GroupKey,
      { total: number; completed: number; rate: number | null; avgSec: number | null }
    >;
    for (const g of GROUP_KEYS) {
      const gs = sessions.filter((s) => s.group === g);
      const done = gs.filter((s) => s.completed_at);
      const secs = done
        .map(
          (s) =>
            (new Date(s.completed_at as string).getTime() -
              new Date(s.started_at).getTime()) /
            1000
        )
        .filter((v) => Number.isFinite(v) && v > 0);
      out[g] = {
        total: gs.length,
        completed: done.length,
        rate: gs.length ? (done.length / gs.length) * 100 : null,
        avgSec: secs.length
          ? secs.reduce((a, b) => a + b, 0) / secs.length
          : null,
      };
    }
    return out;
  }, [sessions]);

  // A그룹 "보통이다"(3점) 선택률 / C그룹 heaping 지표
  const biasSummary = useMemo(() => {
    if (!sessions) return null;
    const aValues = validNumbers(
      sessions
        .filter((s) => s.group === "A")
        .flatMap((s) => s.responses.map((r) => r.value))
    );
    const cValues = validNumbers(
      sessions
        .filter((s) => s.group === "C")
        .flatMap((s) => s.responses.map((r) => r.value))
    );
    const aMidPct = aValues.length
      ? (aValues.filter((v) => v === 3).length / aValues.length) * 100
      : null;
    const cRound10Pct = cValues.length
      ? (cValues.filter((v) => v % 10 === 0).length / cValues.length) * 100
      : null;
    const cAnchorPct = cValues.length
      ? (cValues.filter((v) => v === 0 || v === 50 || v === 100).length /
          cValues.length) *
        100
      : null;
    return { aMidPct, cRound10Pct, cAnchorPct, cValues };
  }, [sessions]);

  // C그룹 응답 분포 히스토그램 (heaping 시각화)
  const cHistogram = useMemo(() => {
    if (!biasSummary) return null;
    const bins = [
      "0–9", "10–19", "20–29", "30–39", "40–49",
      "50–59", "60–69", "70–79", "80–89", "90–99", "100",
    ];
    const counts = new Array(bins.length).fill(0) as number[];
    for (const v of biasSummary.cValues) {
      const i = v >= 100 ? 10 : Math.floor(v / 10);
      counts[i] += 1;
    }
    return { bins, counts, max: Math.max(4, ...counts) };
  }, [biasSummary]);

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

  // D그룹 코딩 대상 (서술 응답이 있는 것만)
  const dCodingRows = useMemo(() => {
    if (!sessions) return [];
    const rows: { session: SessionWithResponses; response: SurveyResponse }[] =
      [];
    for (const s of sessions.filter((x) => x.group === "D")) {
      for (const r of s.responses) {
        if (r.reason_text && r.reason_text.trim()) {
          rows.push({ session: s, response: r });
        }
      }
    }
    return rows;
  }, [sessions]);

  const codedCount = dCodingRows.filter(
    (x) => x.response.manual_code != null
  ).length;

  // 정규화 평균/표준편차 비교 차트 — D그룹은 수동 코딩된 응답만 반영
  const normMeanSeries: BarSeries[] = useMemo(() => {
    if (!agg) return [];
    return GROUP_KEYS.map((g) => ({
      key: g,
      label: GROUPS[g].label,
      color: GROUP_COLOR[g],
      values: QUESTIONS.map((q) => {
        const v = agg.cells[q.id][g].normMean;
        return v === null ? null : Math.round(v * 10) / 10;
      }),
    }));
  }, [agg]);

  const normStdSeries: BarSeries[] = useMemo(() => {
    if (!agg) return [];
    return GROUP_KEYS.map((g) => ({
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

  // ---- 게이트 화면 ----
  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        확인 중…
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="mb-1 text-xl font-bold text-slate-900">
            연구자 대시보드
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            관리자 비밀번호를 입력해 주세요.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && password && !authing) submitPassword();
            }}
            placeholder="비밀번호"
            className="mb-4 w-full rounded-xl border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            autoFocus
          />
          {authError && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {authError}
            </p>
          )}
          <button
            onClick={submitPassword}
            disabled={!password || authing}
            className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {authing ? "확인 중…" : "들어가기"}
          </button>
        </div>
      </main>
    );
  }

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
            응답 척도 형식에 따른 변별력·타당도 비교
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

      {/* 그룹별 요약 카드: 응답자 수·완주율·평균 소요시간 */}
      {groupSummary && agg && (
        <div className="mb-8">
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
            <StatCard label="전체 세션" value={String(agg.totalSessions)} />
            <StatCard
              label="완료 세션"
              value={String(agg.completedSessions)}
              accent
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {GROUP_KEYS.map((g) => {
              const s = groupSummary[g];
              return (
                <div
                  key={g}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: GROUP_COLOR[g] }}
                    />
                    {GROUPS[g].label}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {s.completed}
                    <span className="text-sm font-normal text-slate-400">
                      {" "}
                      / {s.total}명
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    완주율 {s.rate === null ? "—" : `${fmt(s.rate, 0)}%`} · 평균{" "}
                    {s.avgSec === null ? "—" : fmtDuration(s.avgSec)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 응답 스타일 지표 카드 */}
      {biasSummary && (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label='A그룹 "보통이다"(3점) 선택 비율'
            value={
              biasSummary.aMidPct === null
                ? "—"
                : `${fmt(biasSummary.aMidPct, 1)}%`
            }
            color={GROUP_COLOR.A}
            sub="높을수록 중심화 경향이 강함"
          />
          <StatCard
            label="C그룹 10의 배수 응답 비율"
            value={
              biasSummary.cRound10Pct === null
                ? "—"
                : `${fmt(biasSummary.cRound10Pct, 1)}%`
            }
            color={GROUP_COLOR.C}
            sub="특정 숫자로 몰림(heaping) 지표 ①"
          />
          <StatCard
            label="C그룹 0·50·100 응답 비율"
            value={
              biasSummary.cAnchorPct === null
                ? "—"
                : `${fmt(biasSummary.cAnchorPct, 1)}%`
            }
            color={GROUP_COLOR.C}
            sub="특정 숫자로 몰림(heaping) 지표 ②"
          />
        </div>
      )}

      {/* 정규화 평균 비교 */}
      <Section
        title="① 그룹 간 평균 비교 (0~100 정규화)"
        desc="척도 범위가 다르므로 A(1~5)·B(1~4)·C(0~100)를 모두 0~100으로 정규화한 평균입니다. D그룹은 수동 코딩(1~5)된 응답만 매핑표에 따라 반영됩니다."
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

      {/* C그룹 분포 히스토그램 */}
      {cHistogram && (
        <Section
          title="③ C그룹(0~100) 응답 분포 — heaping 확인"
          desc="0~100 슬라이더 응답이 특정 구간·숫자(0, 50, 100, 10의 배수)에 몰리는지 확인합니다. 전 문항 합산 분포입니다."
        >
          <GroupedBarChart
            categories={cHistogram.bins}
            series={[
              {
                key: "C",
                label: GROUPS.C.label,
                color: GROUP_COLOR.C,
                values: cHistogram.counts,
              },
            ]}
            yMax={cHistogram.max}
            yLabel="응답 수"
            unit="건"
          />
        </Section>
      )}

      {/* 문항별 기술통계 테이블 */}
      <Section
        title="④ 구성개념별·그룹별 기술통계"
        desc="모든 통계 옆에 유효 표본수 n을 함께 표시합니다. 표준편차는 표본표준편차(n-1). D그룹의 원점수는 수동 코드(1~5)입니다."
      >
        <div className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Q{q.id}. {q.construct}
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
                              {g === "D" ? (
                                <span className="text-slate-400">척도 없음</span>
                              ) : g === "B" ? (
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

      {/* D그룹 수동 코딩 */}
      {!present && (
        <Section
          title={`⑤ D그룹 서술 응답 수동 코딩 (${codedCount}/${dCodingRows.length})`}
          desc="서술형 응답을 읽고 만족도를 1(매우 낮음)~5(매우 높음)로 코딩합니다. 코딩된 값은 아래 매핑표에 따라 0~100으로 환산되어 ①·② 차트와 통계에 반영됩니다."
        >
          {/* 매핑표 편집 */}
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              코드 → 0~100 매핑표 (직접 수정 가능, 이 브라우저에 저장됨)
            </p>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((code) => (
                <label
                  key={code}
                  className="flex items-center gap-1.5 text-sm text-slate-600"
                >
                  <span className="font-bold">{code}</span>→
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dMap[code] ?? 0}
                    onChange={(e) =>
                      setDMapValue(code, Number(e.target.value))
                    }
                    className="w-16 rounded-lg border border-slate-300 p-1.5 text-center focus:border-indigo-500 focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>

          {dCodingRows.length === 0 ? (
            <p className="text-sm text-slate-400">
              아직 코딩할 D그룹 서술 응답이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {dCodingRows.map(({ response: r }) => {
                const q = QUESTIONS.find((x) => x.id === r.question_id);
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-1 text-xs font-semibold text-slate-400">
                      Q{r.question_id}. {q?.construct ?? ""}
                    </div>
                    <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {r.reason_text}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((code) => {
                        const selected = r.manual_code === code;
                        return (
                          <button
                            key={code}
                            onClick={() =>
                              codeResponse(r.id!, selected ? null : code)
                            }
                            disabled={savingCodeId === r.id}
                            className={`h-9 w-9 rounded-full border-2 text-sm font-bold transition-all disabled:opacity-50 ${
                              selected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300 bg-white text-slate-600 hover:border-indigo-400"
                            }`}
                          >
                            {code}
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs text-slate-400">
                        {r.manual_code != null
                          ? `코드 ${r.manual_code} → ${dMap[r.manual_code] ?? "—"}점`
                          : "미코딩"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* 키워드 빈도 */}
      <Section
        title="⑥ 이유·서술 텍스트 키워드 빈도"
        desc="A/B/C 그룹의 '이유' 서술과 D그룹의 서술형 응답에서 자주 등장한 단어입니다. 정량(점수)과 정성(이유)을 비교하는 데 사용합니다."
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

/** 초 → "m분 s초" 표시 */
function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function StatCard({
  label,
  value,
  accent,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  color?: string;
  sub?: string;
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
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
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
