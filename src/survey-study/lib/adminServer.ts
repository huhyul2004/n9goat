import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { QUESTIONS } from "./questions";
import type {
  GroupKey,
  SessionWithResponses,
  SurveyResponse,
  SurveySession,
} from "./types";

// ------------------------------------------------------------
// [서버 전용] 관리자(연구자) 데이터 접근 계층.
// RLS 하에서 anon 은 조회/수정이 불가하므로, 대시보드가 필요로 하는
// 조회·집계·D그룹 수동코딩은 service_role 로 여기서만 수행한다.
// ------------------------------------------------------------

const TOTAL_QUESTIONS = QUESTIONS.length; // 8

/**
 * 관리자 라우트 접근 가드.
 * - 게이트가 꺼져 있으면(NEXT_PUBLIC_SURVEY_GATE_ENABLED != "true") 통과.
 * - 게이트가 켜져 있으면 요청 헤더 x-survey-admin 값이 관리자 비밀번호와 일치해야 통과.
 *   (게이트를 다시 켤 때, 대시보드가 이 헤더로 비밀번호를 전달하도록 연결하면 된다.)
 */
export function adminGuard(
  req: Request
): { ok: true } | { ok: false; status: number; error: string } {
  const gateEnabled = process.env.NEXT_PUBLIC_SURVEY_GATE_ENABLED === "true";
  if (!gateEnabled) return { ok: true };

  const expected = process.env.SURVEY_ADMIN_PASSWORD ?? "";
  const provided = req.headers.get("x-survey-admin") ?? "";
  if (expected && provided === expected) return { ok: true };
  return { ok: false, status: 401, error: "관리자 인증이 필요합니다." };
}

/** append-only 응답에서 (세션+문항)별 '최신 answered_at' 행만 남긴다 */
function latestPerQuestion(rows: SurveyResponse[]): SurveyResponse[] {
  const latest = new Map<number, SurveyResponse>();
  for (const r of rows) {
    const prev = latest.get(r.question_id);
    if (!prev || r.answered_at > prev.answered_at) {
      latest.set(r.question_id, r);
    }
  }
  return [...latest.values()].sort((a, b) => a.question_id - b.question_id);
}

/**
 * 대시보드용: 모든 세션 + 응답을 합쳐 반환.
 * - append-only 이므로 문항별 최신 행만 채택.
 * - completed_at 은 저장하지 않고 여기서 도출한다:
 *   한 세션이 8개 문항을 모두 커버하면 '완료'로 보고, 완료 시각은 마지막 응답 시각.
 */
export async function fetchAllSessionsAdmin(): Promise<SessionWithResponses[]> {
  const admin = getSupabaseAdmin();

  const { data: sessionRows, error: sErr } = await admin
    .from("survey_sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (sErr) throw new Error(sErr.message);

  const { data: responseRows, error: rErr } = await admin
    .from("survey_responses")
    .select("*");
  if (rErr) throw new Error(rErr.message);

  const bySession = new Map<string, SurveyResponse[]>();
  for (const raw of (responseRows as Record<string, unknown>[]) || []) {
    const row: SurveyResponse = {
      id: raw.id as string,
      session_id: raw.session_id as string,
      question_id: Number(raw.question_id),
      value: raw.value === null ? null : Number(raw.value),
      reason_text: (raw.reason_text as string) ?? null,
      manual_code:
        raw.manual_code === null || raw.manual_code === undefined
          ? null
          : Number(raw.manual_code),
      duration_ms: raw.duration_ms === null ? null : Number(raw.duration_ms),
      answered_at: raw.answered_at as string,
    };
    const arr = bySession.get(row.session_id) || [];
    arr.push(row);
    bySession.set(row.session_id, arr);
  }

  return ((sessionRows as Record<string, unknown>[]) || []).map((s) => {
    const sessionId = s.id as string;
    const responses = latestPerQuestion(bySession.get(sessionId) || []);

    // 완료 도출: 8개 문항을 모두 커버하면 완료. 완료 시각 = 마지막 응답 시각.
    const covered = responses.length;
    const derivedCompletedAt =
      covered >= TOTAL_QUESTIONS
        ? responses.reduce(
            (max, r) => (r.answered_at > max ? r.answered_at : max),
            responses[0].answered_at
          )
        : null;

    const session: SurveySession = {
      id: sessionId,
      group: s.survey_group as GroupKey,
      started_at: s.started_at as string,
      // 저장된 completed_at(레거시)이 있으면 존중하되, 없으면 도출값 사용
      completed_at: (s.completed_at as string) ?? derivedCompletedAt,
      grade: (s.grade as string) ?? null,
      affiliation: (s.affiliation as string) ?? null,
      created_at: s.created_at as string,
    };
    return { ...session, responses };
  });
}

/** D그룹 서술 응답에 수동 코드(1~5) 부여/해제 — service_role UPDATE */
export async function updateManualCodeAdmin(
  responseId: string,
  code: number | null
): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("survey_responses")
    .update({ manual_code: code })
    .eq("id", responseId);
  if (error) throw new Error(error.message);
}
