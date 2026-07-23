import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GROUPS, assignRandomGroup, orderedQuestions } from "./questions";
import type { ScaleGroupKey, StartResponse, SurveyItem } from "./types";

// ------------------------------------------------------------
// [서버 전용] 세션 생성 + 그룹 배정.
// [블라인드] 그룹 배정을 서버에서 수행하고 survey_group 을 서버에만 저장한다.
// 클라이언트에는 '해석된 문항(텍스트+입력방식)'만 내려주므로, 응답자는
// 자신이 A/B/C/D 중 무엇인지 알 수 없다(URL·스토리지·네트워크 어디에도 그룹 글자 없음).
// ------------------------------------------------------------

export async function createSessionWithItems(input: {
  grade?: string | null;
  affiliation?: string | null;
}): Promise<StartResponse> {
  const admin = getSupabaseAdmin();

  const group = assignRandomGroup(); // 서버에서만 결정, 응답 밖으로 나가지 않음
  const startedAt = new Date().toISOString();
  const sessionId = crypto.randomUUID();

  const { error } = await admin.from("survey_sessions").insert({
    id: sessionId,
    survey_group: group,
    started_at: startedAt,
    grade: input.grade ?? null,
    affiliation: input.affiliation ?? null,
  });
  if (error) throw new Error(error.message);

  const cfg = GROUPS[group];
  const items: SurveyItem[] = orderedQuestions(group).map((q) => ({
    questionId: q.id,
    text:
      cfg.kind === "openText"
        ? q.descriptive
        : q.variants[group as ScaleGroupKey],
    kind: cfg.kind,
    min: cfg.min,
    max: cfg.max,
    leftLabel: cfg.leftLabel,
    rightLabel: cfg.rightLabel,
    pointLabels: cfg.pointLabels,
    askReason: cfg.askReason,
  }));

  return { sessionId, startedAt, items };
}
