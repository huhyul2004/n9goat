"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/survey-study/components/ProgressBar";
import QuestionInput, {
  type AnswerDraft,
} from "@/survey-study/components/QuestionInput";
import { saveResponse, saveResponses, startSurvey } from "@/survey-study/lib/db";
import type { SurveyItem } from "@/survey-study/lib/types";

type Step = "demographics" | "question" | "submitting";

export default function RespondPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("demographics");

  // 서버가 내려준 세션/문항 (그룹 글자는 포함되지 않음)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<SurveyItem[]>([]);

  const [grade, setGrade] = useState("");
  const [affiliation, setAffiliation] = useState("");

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerDraft[]>([]);
  const [durations, setDurations] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 현재 문항이 화면에 나타난 시각(ms) — 소요시간 측정용
  const shownAt = useRef<number>(0);

  const total = items.length;

  const startQuestions = async () => {
    setError(null);
    setStep("submitting");
    const res = await startSurvey({
      grade: grade.trim() || null,
      affiliation: affiliation.trim() || null,
    });
    if (!res.ok || !res.data) {
      setError(
        res.error ??
          "시작에 실패했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요."
      );
      setStep("demographics");
      return;
    }
    setSessionId(res.data.sessionId);
    setItems(res.data.items);
    setAnswers(res.data.items.map(() => ({ value: null, reason: "" })));
    setDurations(res.data.items.map(() => 0));
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

  /**
   * 현재 문항을 즉시 서버에 저장(중도 이탈 시에도 부분 데이터 확보).
   * append-only INSERT 이므로 다시 답하면 새 행이 쌓이고, 최신 행은
   * 서버 집계에서 채택된다. 실패해도 흐름을 막지 않는다.
   */
  const persistCurrent = (durationMs: number, draft: AnswerDraft) => {
    if (!sessionId || !items[index]) return;
    void saveResponse({
      session_id: sessionId,
      question_id: items[index].questionId,
      value: draft.value,
      reason_text: draft.reason.trim() || null,
      duration_ms: durationMs > 0 ? durationMs : null,
      answered_at: new Date().toISOString(),
    });
  };

  /** 현재 문항에 머문 시간을 누적하고 그 총합을 반환 */
  const accumulateDuration = (): number => {
    const now = Date.now();
    const elapsed = Math.max(0, now - shownAt.current);
    const totalMs = (durations[index] || 0) + elapsed;
    setDurations((prev) => {
      const next = [...prev];
      next[index] = totalMs;
      return next;
    });
    shownAt.current = now;
    return totalMs;
  };

  // accumulateDuration() 이 shownAt.current 를 '지금'으로 이미 재설정하므로
  // 이동 후 별도 타임스탬프 리셋은 하지 않는다(중복).
  const goPrev = () => {
    if (index === 0) return;
    accumulateDuration();
    setIndex((i) => i - 1);
  };

  const goNext = () => {
    const totalMs = accumulateDuration();
    persistCurrent(totalMs, answers[index]);
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      submitAll();
    }
  };

  const skip = () => {
    // 현재 문항을 결측(값 없음)으로 두고 이동
    const draft = { value: null, reason: answers[index].reason };
    updateAnswer(draft);
    const totalMs = accumulateDuration();
    persistCurrent(totalMs, draft);
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      submitAll();
    }
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
    const rows = items.map((it, i) => ({
      session_id: sessionId,
      question_id: it.questionId,
      value: answers[i].value, // 서술형/건너뜀이면 null
      reason_text: answers[i].reason.trim() || null,
      duration_ms: finalDurations[i] || null,
      answered_at: answeredAt,
    }));

    // 최종 확정 스냅샷을 한 번에 INSERT(append-only). 완료 여부는 서버가
    // '8문항 커버리지'로 도출하므로 별도 완료 UPDATE 는 하지 않는다.
    const saveRes = await saveResponses(rows);
    if (!saveRes.ok) {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
      setStep("question");
      return;
    }
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
            {step === "submitting" ? "준비 중…" : "시작하기"}
          </button>
        </div>
      </main>
    );
  }

  // 문항이 없는 상태(직접 진입/새로고침 등)면 처음으로 돌려보낸다.
  if (!items[index]) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-5 py-10 text-center">
        <p className="text-slate-500">
          진행 정보가 없어 처음 화면으로 이동합니다.
        </p>
        <button
          onClick={() => router.replace("/survey-study")}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-700"
        >
          처음으로
        </button>
      </main>
    );
  }

  // ---- 문항 화면 ----
  const answer = answers[index];
  const item = items[index];
  const answered =
    item.kind === "openText"
      ? answer.reason.trim().length > 0
      : answer.value !== null;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8">
      <div className="mb-6">
        <ProgressBar current={index + 1} total={total} />
      </div>

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <QuestionInput item={item} answer={answer} onChange={updateAnswer} />
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
