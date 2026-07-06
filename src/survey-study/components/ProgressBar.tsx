"use client";

export default function ProgressBar({
  current,
  total,
}: {
  current: number; // 1-based
  total: number;
}) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 text-sm text-slate-500">
        <span className="font-medium">
          {current} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
