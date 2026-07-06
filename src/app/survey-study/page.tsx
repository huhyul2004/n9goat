"use client";

import { useRouter } from "next/navigation";
import { assignRandomGroup } from "@/survey-study/lib/questions";

/** 응답자 진입 화면: 연구 목적 안내 + 시작하기 */
export default function SurveyIntroPage() {
  const router = useRouter();

  const start = () => {
    // 응답자가 알 수 없게 그룹을 무작위 배정 (링크 하나로 자동 분배)
    const group = assignRandomGroup();
    const startedAt = new Date().toISOString();
    sessionStorage.setItem(
      "survey-study:init",
      JSON.stringify({ group, startedAt })
    );
    router.push("/survey-study/respond");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="mb-2 text-sm font-semibold tracking-wide text-indigo-600">
          설문 연구 참여
        </p>
        <h1 className="mb-4 text-2xl font-bold leading-snug text-slate-900">
          응답 방식에 따른 설문 응답 차이 연구
        </h1>
        <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">
          <p>
            이 설문은 <b>설문 응답 방식에 따라 사람들의 응답이 어떻게 달라지는지</b>를
            알아보기 위한 연구입니다. 같은 질문이라도 사람마다 다른 형태의
            응답지가 제시됩니다.
          </p>
          <p>
            응답은 <b>완전한 무기명</b>으로 처리되며, 참여는 자발적입니다.
            언제든 중단할 수 있고, 개인을 식별하는 정보는 수집하지 않습니다.
          </p>
          <p>총 8문항이며, 약 3~5분 정도 소요됩니다.</p>
        </div>

        <button
          onClick={start}
          className="mt-7 w-full rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white transition-colors hover:bg-indigo-700 active:scale-[0.99]"
        >
          시작하기
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">
          시작하기를 누르면 연구 참여에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </main>
  );
}
