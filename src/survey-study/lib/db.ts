import { supabase } from "@/lib/supabase";
import type {
  GroupKey,
  SessionWithResponses,
  SurveyResponse,
  SurveySession,
} from "./types";

// 기존 N9의 supabase 클라이언트(인프라)만 재사용하고,
// survey-study 전용 테이블(survey_sessions / survey_responses)만 다룬다.

/** 세션 생성 → 생성된 세션 id 반환 */
export async function createSession(input: {
  group: GroupKey;
  startedAt: string;
  grade?: string | null;
  affiliation?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data, error } = await supabase
    .from("survey_sessions")
    .insert({
      survey_group: input.group,
      started_at: input.startedAt,
      grade: input.grade ?? null,
      affiliation: input.affiliation ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[survey createSession]", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, id: (data as { id: string }).id };
}

/** 응답 한 건 저장 (upsert: 같은 세션+문항이면 갱신) */
export async function saveResponse(
  r: Omit<SurveyResponse, "id" | "created_at">
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("survey_responses")
    .upsert(
      {
        session_id: r.session_id,
        question_id: r.question_id,
        value: r.value,
        reason_text: r.reason_text,
        duration_ms: r.duration_ms,
        answered_at: r.answered_at,
      },
      { onConflict: "session_id,question_id" }
    );
  if (error) {
    console.error("[survey saveResponse]", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** 여러 응답을 한 번에 저장 */
export async function saveResponses(
  rows: Omit<SurveyResponse, "id" | "created_at">[]
): Promise<{ ok: boolean; error?: string }> {
  if (rows.length === 0) return { ok: true };
  const { error } = await supabase.from("survey_responses").upsert(
    rows.map((r) => ({
      session_id: r.session_id,
      question_id: r.question_id,
      value: r.value,
      reason_text: r.reason_text,
      duration_ms: r.duration_ms,
      answered_at: r.answered_at,
    })),
    { onConflict: "session_id,question_id" }
  );
  if (error) {
    console.error("[survey saveResponses]", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** 세션 완료 처리 */
export async function completeSession(
  sessionId: string,
  completedAt: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("survey_sessions")
    .update({ completed_at: completedAt })
    .eq("id", sessionId);
  if (error) {
    console.error("[survey completeSession]", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** 대시보드용: 모든 세션 + 응답을 합쳐서 반환 */
export async function fetchAllSessions(): Promise<SessionWithResponses[]> {
  const { data: sessions, error: sErr } = await supabase
    .from("survey_sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (sErr) {
    console.error("[survey fetchAllSessions/sessions]", sErr.message);
    return [];
  }

  const { data: responses, error: rErr } = await supabase
    .from("survey_responses")
    .select("*");
  if (rErr) {
    console.error("[survey fetchAllSessions/responses]", rErr.message);
    return [];
  }

  const bySession = new Map<string, SurveyResponse[]>();
  for (const raw of (responses as Record<string, unknown>[]) || []) {
    const row: SurveyResponse = {
      session_id: raw.session_id as string,
      question_id: Number(raw.question_id),
      value: raw.value === null ? null : Number(raw.value),
      reason_text: (raw.reason_text as string) ?? null,
      duration_ms: raw.duration_ms === null ? null : Number(raw.duration_ms),
      answered_at: raw.answered_at as string,
    };
    const arr = bySession.get(row.session_id) || [];
    arr.push(row);
    bySession.set(row.session_id, arr);
  }

  return ((sessions as Record<string, unknown>[]) || []).map((s) => {
    const session: SurveySession = {
      id: s.id as string,
      group: s.survey_group as GroupKey,
      started_at: s.started_at as string,
      completed_at: (s.completed_at as string) ?? null,
      grade: (s.grade as string) ?? null,
      affiliation: (s.affiliation as string) ?? null,
      created_at: s.created_at as string,
    };
    return {
      ...session,
      responses: (bySession.get(session.id) || []).sort(
        (a, b) => a.question_id - b.question_id
      ),
    };
  });
}
