import type { SessionWithResponses } from "./types";

/** CSV 셀 이스케이프 */
function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * 세션+응답을 long-format(문항 1행) CSV 문자열로 변환.
 * 통계 프로그램(엑셀/R/파이썬)에서 바로 분석하기 좋은 형태.
 */
export function toCsv(sessions: SessionWithResponses[]): string {
  const header = [
    "session_id",
    "group",
    "grade",
    "affiliation",
    "started_at",
    "completed_at",
    "question_id",
    "value",
    "duration_ms",
    "reason_text",
  ];
  const lines: string[] = [header.join(",")];

  for (const s of sessions) {
    if (s.responses.length === 0) {
      lines.push(
        [
          esc(s.id),
          esc(s.group),
          esc(s.grade),
          esc(s.affiliation),
          esc(s.started_at),
          esc(s.completed_at),
          "",
          "",
          "",
          "",
        ].join(",")
      );
      continue;
    }
    for (const r of s.responses) {
      lines.push(
        [
          esc(s.id),
          esc(s.group),
          esc(s.grade),
          esc(s.affiliation),
          esc(s.started_at),
          esc(s.completed_at),
          esc(r.question_id),
          esc(r.value),
          esc(r.duration_ms),
          esc(r.reason_text),
        ].join(",")
      );
    }
  }
  return lines.join("\n");
}

/** 브라우저에서 CSV 파일 다운로드 트리거 */
export function downloadCsv(filename: string, csv: string): void {
  // 엑셀 한글 깨짐 방지용 UTF-8 BOM (U+FEFF)
  const BOM = "﻿";
  const blob = new Blob([BOM + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
