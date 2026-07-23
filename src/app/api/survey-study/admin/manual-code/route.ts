import { NextResponse } from "next/server";
import {
  adminGuard,
  updateManualCodeAdmin,
} from "@/survey-study/lib/adminServer";

// D그룹 서술 응답 수동코딩 전용 (service_role UPDATE). 서버에서만 실행.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = adminGuard(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  let responseId = "";
  let code: number | null = null;
  try {
    const body = (await req.json()) as {
      responseId?: string;
      code?: number | null;
    };
    responseId = body.responseId ?? "";
    code = body.code ?? null;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!responseId) {
    return NextResponse.json(
      { error: "responseId 가 필요합니다." },
      { status: 400 }
    );
  }
  if (code !== null && !(Number.isInteger(code) && code >= 1 && code <= 5)) {
    return NextResponse.json(
      { error: "code 는 1~5 정수 또는 null 이어야 합니다." },
      { status: 400 }
    );
  }

  try {
    await updateManualCodeAdmin(responseId, code);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
