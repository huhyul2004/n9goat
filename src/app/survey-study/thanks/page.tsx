"use client";

export default function ThanksPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-10 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          응답해 주셔서 감사합니다
        </h1>
        <p className="text-[15px] leading-relaxed text-slate-600">
          소중한 시간을 내어 주셔서 감사합니다.
          <br />
          좋은 하루 보내세요!
        </p>
      </div>
    </main>
  );
}
