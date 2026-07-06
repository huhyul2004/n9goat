"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/survey-study/components/ProgressBar";
import QuestionInput, {
  type AnswerDraft,
} from "@/survey-study/components/QuestionInput";
import { GROUPS, QUESTIONS } from "@/survey-study/lib/questions";
import {
  completeSession,
  createSession,
  saveResponses,
} from "@/survey-study/lib/db";
import type { GroupKey } from "@/survey-study/lib/types";

type Step = "loading" | "demographics" | "question" | "submitting";

export default function RespondPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [group, setGroup] = useState<GroupKey | null>(null);
  const [startedAt, setStartedAt] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [grade, setGrade] = useState("");
  const [affiliation, setAffiliation] = useState("");

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerDraft[]>(
    QUESTIONS.map(() => ({ value: null, reason: "" }))
  );
  const [durations, setDurations] = useState<number[]>(
    QUESTIONS.map(() => 0)
  );
  const [error, setError] = useState<string | null>(null);

  // 현재 문항이 화면에 나타난 시각(ms) — 소요시간 측정용
  const shownAt = useRef<number>(0);

  // 초기화: 인트로에서 저장한 group/startedAt 로드
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? sessionStorage.getItem("survey-study:init")
        : null;
    if (!raw) {
      router.replace("/survey-study");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { group: GroupKey; startedAt: string };
      setGroup(parsed.group);
      setStartedAt(parsed.startedAt);
      setStep("demographics");
    } catch {
      router.replace("/survey-study");
    }
  }, [router]);

  if (step === "loading" || !group) {
    return (
      <main className="flex min-h-screen items-center justify-center text-slate-400">
        불러오는 중…
      </main>
    );
  }

  const cfg = GROUPS[group];
  const total = QUESTIONS.length;

  /** 현재 문항에 머문 시간을 durations에 누적 */
  const accumulateDuration = () => {
    const now = Date.now();
    const elapsed = now - shownAt.current;
    setDurations((prev) => {
      const next = [...prev];
      next[index] = (next[index] || 0) + Math.max(0, elapsed);
      return next;
    });
    shownAt.current = now;
  };

  const startQuestions = async () => {
    setError(null);
    setStep("submitting");
    const res = await createSession({
      group,
      startedAt,
      grade: grade.trim() || null,
      affiliation: affiliation.trim() || null,
    });
    if (!res.ok || !res.id) {
      setError(
        "세션 생성에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요."
      );
      setStep("demographics");
      return;
    }
    setSessionId(res.id);
    setIndex(0);
    shownAt.current = Date.now();
    setStep("question");
  };

  const updateAnswer = (a: AnswerDraft) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = a;
      return next;
    });
  };

  const goPrev = () => {
    if (index === 0) return;
    accumulateDuration();
    setIndex((i) => i - 1);
    shownAt.current = Date.now();
  };

  const goNext = () => {
    accumulateDuration();
    if (index < total - 1) {
      setIndex((i) => i + 1);
      shownAt.current = Date.now();
    } else {
      submitAll();
    }
  };

  const skip = () => {
    // 현재 문항을 결측(값 없음)으로 두고 이동
    updateAnswer({ value: null, reason: answers[index].reason });
    goNext();
  };

  const submitAll = async () => {
    if (!sessionId) return;
    setStep("submitting");
    setError(null);

    // durations 최신값 반영을 위해 현재 문항 시간 누적 (state 비동기 회피 위해 직접 계산)
    const finalDurations = [...durations];
    const now = Date.now();
    finalDurations[index] =
      (finalDurations[index] || 0) + Math.max(0, now - shownAt.current);

    const answeredAt = new Date().toISOString();
    const rows = QUESTIONS.map((q, i) => ({
      session_id: sessionId,
      question_id: q.id,
      value: answers[i].value, // D그룹/건너뜀이면 null
      reason_text: answers[i].reason.trim() || null,
      duration_ms: finalDurations[i] || null,
      answered_at: answeredAt,
    }));

    const saveRes = await saveResponses(rows);
    if (!saveRes.ok) {
      setError("응답 저장에 실패했습니다. 다시 시도해 주세요.");
      setStep("question");
      return;
    }
    await completeSession(sessionId, new Date().toISOString());
    sessionStorage.removeItem("survey-study:init");
    router.replace("/survey-study/thanks");
  };

  // ---- 인구통계 화면 ----
  if (step === "demographics" || (step === "submitting" && !sessionId)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="mb-1 text-xl font-bold text-slate-900">
            간단한 정보를 입력해 주세요
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            모두 <b>선택 입력</b>입니다. 입력하지 않아도 다음으로 넘어갈 수 있어요.
          </p>

          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            학년
          </label>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="예: 중2, 고1"
            className="mb-4 w-full rounded-xl border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />

          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            소속 (학교/캠프 등)
          </label>
          <input
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="예: OO중학교"
            className="mb-6 w-full rounded-xl border border-slate-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={startQuestions}
            disabled={step === "submitting"}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {step === "submitting" ? "준비 중…" : "설문 시작"}
          </button>
        </div>
      </main>
    );
  }

  // ---- 문항 화면 ----
  const answer = answers[index];
  const q = QUESTIONS[index];
  const answered =
    cfg.kind === "openText"
      ? answer.reason.trim().length > 0
      : answer.value !== null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8">
      <div className="mb-6">
        <ProgressBar current={index + 1} total={total} />
      </div>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <QuestionInput
          group={cfg}
          question={q}
          answer={answer}
          onChange={updateAnswer}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={goPrev}
          disabled={index === 0 || step === "submitting"}
          className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          이전
        </button>
        <button
          onClick={skip}
          disabled={step === "submitting"}
          className="text-sm text-slate-400 underline underline-offset-2 hover:text-slate-600"
        >
          건너뛰기
        </button>
        <button
          onClick={goNext}
          disabled={!answered || step === "submitting"}
          className="ml-auto rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {step === "submitting"
            ? "제출 중…"
            : index < total - 1
            ? "다음"
            : "제출"}
        </button>
      </div>
    </main>
  );
}
