"use client";

import { useRouter } from "next/navigation";

/**
 * 응답자 진입 화면.
 * [내부 원칙] 조사 목적·설계에 대한 어떤 단서도 노출하지 않는다.
 * 평범한 "생활 만족도 의견 조사" 안내만 표시한다.
 * (그룹 배정·세션 생성은 다음 화면에서 서버가 처리하므로 여기선 이동만 한다.)
 */
export default function SurveyIntroPage() {
  const router = useRouter();

  const start = () => {
    router.push("/survey-study/respond");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="mb-2 text-sm font-semibold tracking-wide text-indigo-600">
          의견 조사
        </p>
        <h1 className="mb-4 text-2xl font-bold leading-snug text-slate-900">
          생활 만족도에 대한 간단한 의견 조사입니다
        </h1>
        <div className="space-y-3 text-[15px] leading-relaxed text-slate-600">
          <p>
            학교(기관) 생활에 대한 여러분의 솔직한 의견을 여쭤보고 싶습니다.
            총 8개의 질문이며, 약 3분 정도 걸립니다.
          </p>
          <p>
            응답은 <b>이름 없이(무기명)</b> 처리되며, 개인을 알아볼 수 있는
            정보는 수집하지 않습니다. 참여는 자유이며 언제든 그만두실 수
            있습니다.
          </p>
          <p>정답은 없으니, 평소 느끼는 그대로 편하게 답해 주세요.</p>
        </div>

        <button
          onClick={start}
          className="mt-7 w-full rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white transition-colors hover:bg-indigo-700 active:scale-[0.99]"
        >
          시작하기
        </button>
      </div>
    </main>
  );
}
