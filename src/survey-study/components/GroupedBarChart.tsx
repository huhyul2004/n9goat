"use client";

export interface BarSeries {
  key: string;
  label: string;
  color: string;
  /** categories 와 같은 길이. null 이면 막대 없음(N/A) */
  values: (number | null)[];
}

/**
 * 의존성 없는 순수 SVG 그룹 막대그래프.
 * 발표/자소서 캡처를 고려해 축·눈금·범례·값 라벨을 명확히 표시.
 */
export default function GroupedBarChart({
  categories,
  series,
  yMax,
  yLabel,
  unit = "",
  height = 320,
}: {
  categories: string[];
  series: BarSeries[];
  yMax: number;
  yLabel: string;
  unit?: string;
  height?: number;
}) {
  const width = 720;
  const padL = 56;
  const padR = 16;
  const padT = 20;
  const padB = 56;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const groupCount = categories.length;
  const groupW = plotW / groupCount;
  const barGap = 6;
  const innerW = groupW * 0.72;
  const barW = (innerW - barGap * (series.length - 1)) / series.length;

  const yTicks = 5;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => (yMax / yTicks) * i);

  const yToPx = (v: number) => padT + plotH - (v / yMax) * plotH;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[560px]"
        role="img"
        aria-label={yLabel}
      >
        {/* Y축 라벨 */}
        <text
          x={14}
          y={padT + plotH / 2}
          transform={`rotate(-90 14 ${padT + plotH / 2})`}
          textAnchor="middle"
          className="fill-slate-500"
          fontSize={12}
        >
          {yLabel}
        </text>

        {/* 그리드 + 눈금 */}
        {ticks.map((t, i) => {
          const y = yToPx(t);
          return (
            <g key={i}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400"
                fontSize={11}
              >
                {Math.round(t)}
                {unit}
              </text>
            </g>
          );
        })}

        {/* 막대 */}
        {categories.map((cat, ci) => {
          const gx = padL + ci * groupW + (groupW - innerW) / 2;
          return (
            <g key={cat}>
              {series.map((s, si) => {
                const v = s.values[ci];
                const x = gx + si * (barW + barGap);
                if (v === null || !Number.isFinite(v)) {
                  return (
                    <text
                      key={s.key}
                      x={x + barW / 2}
                      y={padT + plotH - 4}
                      textAnchor="middle"
                      className="fill-slate-300"
                      fontSize={10}
                    >
                      N/A
                    </text>
                  );
                }
                const y = yToPx(v);
                const h = padT + plotH - y;
                return (
                  <g key={s.key}>
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx={2}
                      fill={s.color}
                    />
                    <text
                      x={x + barW / 2}
                      y={y - 4}
                      textAnchor="middle"
                      className="fill-slate-600"
                      fontSize={10}
                    >
                      {Math.round(v)}
                    </text>
                  </g>
                );
              })}
              {/* X축 카테고리 라벨 */}
              <text
                x={padL + ci * groupW + groupW / 2}
                y={height - padB + 20}
                textAnchor="middle"
                className="fill-slate-600"
                fontSize={12}
              >
                {cat}
              </text>
            </g>
          );
        })}

        {/* 축 선 */}
        <line
          x1={padL}
          y1={padT + plotH}
          x2={width - padR}
          y2={padT + plotH}
          stroke="#94a3b8"
          strokeWidth={1.5}
        />
      </svg>

      {/* 범례 */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-slate-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
