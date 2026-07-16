"use client";

import type { GroupConfig, Question, ScaleGroupKey } from "../lib/types";

export interface AnswerDraft {
  value: number | null;
  reason: string;
}

export default function QuestionInput({
  group,
  question,
  answer,
  onChange,
}: {
  group: GroupConfig;
  question: Question;
  answer: AnswerDraft;
  onChange: (a: AnswerDraft) => void;
}) {
  const setValue = (value: number | null) => onChange({ ...answer, value });
  const setReason = (reason: string) => onChange({ ...answer, reason });

  const text =
    group.kind === "openText"
      ? question.descriptive
      : question.variants[group.key as ScaleGroupKey];

  return (
    <div className="space-y-6">
      {/* 문항 텍스트 */}
      <p className="text-lg font-semibold leading-relaxed text-slate-800">
        {text}
      </p>

      {/* 그룹별 응답 UI */}
      {group.kind === "scale5" && (
        <CircleScale
          min={1}
          max={5}
          value={answer.value}
          onPick={setValue}
          pointLabels={group.pointLabels}
        />
      )}

      {group.kind === "scale4" && (
        <CircleScale
          min={1}
          max={4}
          value={answer.value}
          onPick={setValue}
          pointLabels={group.pointLabels}
        />
      )}

      {group.kind === "slider100" && (
        <SliderScale
          value={answer.value}
          onPick={setValue}
          leftLabel={group.leftLabel}
          rightLabel={group.rightLabel}
        />
      )}

      {group.kind === "openText" && (
        <textarea
          value={answer.reason}
          onChange={(e) => setReason(e.target.value)}
          rows={6}
          placeholder="자유롭게 적어 주세요."
          className="w-full rounded-xl border border-slate-300 p-4 text-base leading-relaxed focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      )}

      {/* 이유 서술 (A/B/C) */}
      {group.askReason && (
        <div className="pt-2">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            왜 그렇게 생각하시는지 자유롭게 적어 주세요.{" "}
            <span className="text-slate-400">(선택)</span>
          </label>
          <textarea
            value={answer.reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="예: 평소에 ~해서 그렇게 느꼈습니다."
            className="w-full rounded-xl border border-slate-300 p-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      )}
    </div>
  );
}

/** 원형 버튼 척도 (5점/4점 공용) — 각 선택지 아래 라벨 표시 */
function CircleScale({
  min,
  max,
  value,
  onPick,
  pointLabels,
}: {
  min: number;
  max: number;
  value: number | null;
  onPick: (v: number) => void;
  pointLabels?: string[];
}) {
  const nums: number[] = [];
  for (let i = min; i <= max; i++) nums.push(i);

  return (
    <div>
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        {nums.map((n, i) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
              aria-pressed={selected}
              aria-label={pointLabels?.[i] ?? `${n}`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-bold transition-all sm:h-16 sm:w-16 sm:text-xl ${
                  selected
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-lg scale-105"
                    : "border-slate-300 bg-white text-slate-600 group-hover:border-indigo-400 group-hover:bg-indigo-50"
                }`}
              >
                {n}
              </span>
              {pointLabels?.[i] && (
                <span
                  className={`text-center text-[10px] leading-tight sm:text-xs ${
                    selected ? "font-semibold text-indigo-600" : "text-slate-500"
                  }`}
                >
                  {pointLabels[i]}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 0~100 슬라이더 척도 */
function SliderScale({
  value,
  onPick,
  leftLabel,
  rightLabel,
}: {
  value: number | null;
  onPick: (v: number) => void;
  leftLabel?: string;
  rightLabel?: string;
}) {
  const shown = value ?? 50;
  const touched = value !== null;
  return (
    <div>
      <div className="mb-4 text-center">
        <span
          className={`inline-block rounded-full px-4 py-1 text-2xl font-bold ${
            touched ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400"
          }`}
        >
          {touched ? shown : "—"}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={shown}
        onChange={(e) => onPick(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 sm:text-sm">
        <span>{leftLabel} (0)</span>
        <span>{rightLabel} (100)</span>
      </div>
      {!touched && (
        <p className="mt-2 text-center text-xs text-slate-400">
          슬라이더를 움직여 답해 주세요.
        </p>
      )}
    </div>
  );
}
