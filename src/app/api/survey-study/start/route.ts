import { NextResponse } from "next/server";
import { createSessionWithItems } from "@/survey-study/lib/sessionServer";

// 응답 시작: 서버에서 그룹 배정 + 세션 생성 후, 해석된 문항만 반환.
// [블라인드] 응답 바디에 그룹 글자/연구 용어가 포함되지 않는다.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let grade: string | null = null;
  let affiliation: string | null = null;
  try {
    const body = (await req.json()) as {
      grade?: string | null;
      affiliation?: string | null;
    };
    grade = body.grade ?? null;
    affiliation = body.affiliation ?? null;
  } catch {
    // 본문 없음 → 인구통계 미입력으로 진행
  }

  try {
    const data = await createSessionWithItems({ grade, affiliation });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "시작에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
