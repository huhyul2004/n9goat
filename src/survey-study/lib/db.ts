import { supabase } from "@/lib/supabase";
import type {
  StartResponse,
  SurveyResponse,
  SessionWithResponses,
} from "./types";

// 기존 N9의 supabase 클라이언트(anon)만 재사용하고,
// survey-study 전용 테이블(survey_sessions / survey_responses)만 다룬다.
//
// [보안/설계] anon 역할은 RLS 상 INSERT 만 가능하다(조회·수정·삭제 불가).
//  - 세션 생성 + 그룹 배정은 서버(/api/survey-study/start)에서만 → 그룹 글자가 클라이언트로 안 나옴.
//  - 응답 저장은 anon 이 '조회 없이' INSERT 만 수행한다(RETURNING 을 쓰지 않음).
//  - 응답은 append-only: 같은 문항을 다시 답하면 새 행이 쌓이고,
//    최신 행 채택은 서버(집계)에서 처리한다.
//  - 조회·집계·D그룹 수동코딩은 service_role 서버 라우트(/api/survey-study/admin/*)로만.

/**
 * 응답 시작: 서버가 그룹을 배정·세션 생성하고 '해석된 문항'만 돌려준다.
 * (그룹 글자·연구 용어는 응답 어디에도 없음)
 */
export async function startSurvey(input: {
  grade?: string | null;
  affiliation?: string | null;
}): Promise<{ ok: boolean; data?: StartResponse; error?: string }> {
  try {
    const res = await fetch("/api/survey-study/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return { ok: false, error: body?.error ?? "시작에 실패했습니다." };
    }
    const data = (await res.json()) as StartResponse;
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "시작에 실패했습니다.",
    };
  }
}

/** 응답 한 건 저장 (append-only INSERT) */
export async function saveResponse(
  r: Omit<SurveyResponse, "id" | "created_at">
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("survey_responses").insert({
    session_id: r.session_id,
    question_id: r.question_id,
    value: r.value,
    reason_text: r.reason_text,
    duration_ms: r.duration_ms,
    answered_at: r.answered_at,
  });
  if (error) {
    console.error("[survey saveResponse]", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** 여러 응답을 한 번에 저장 (append-only INSERT) */
export async function saveResponses(
  rows: Omit<SurveyResponse, "id" | "created_at">[]
): Promise<{ ok: boolean; error?: string }> {
  if (rows.length === 0) return { ok: true };
  const { error } = await supabase.from("survey_responses").insert(
    rows.map((r) => ({
      session_id: r.session_id,
      question_id: r.question_id,
      value: r.value,
      reason_text: r.reason_text,
      duration_ms: r.duration_ms,
      answered_at: r.answered_at,
    }))
  );
  if (error) {
    console.error("[survey saveResponses]", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * D그룹 서술 응답에 수동 코드(1~5) 부여/해제 — 관리자 대시보드 전용.
 * anon 은 UPDATE 불가하므로 service_role 서버 라우트로 위임한다.
 */
export async function updateManualCode(
  responseId: string,
  code: number | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/survey-study/admin/manual-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseId, code }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return { ok: false, error: body?.error ?? "저장에 실패했습니다." };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "저장에 실패했습니다.",
    };
  }
}

/**
 * 대시보드용: 모든 세션 + 응답을 합쳐서 반환.
 * anon 은 SELECT 불가하므로 service_role 서버 라우트로 위임한다.
 */
export async function fetchAllSessions(): Promise<SessionWithResponses[]> {
  const res = await fetch("/api/survey-study/admin/sessions", {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "데이터를 불러오지 못했습니다.");
  }
  const body = (await res.json()) as { sessions: SessionWithResponses[] };
  return body.sessions ?? [];
}
