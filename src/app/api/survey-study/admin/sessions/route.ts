import { NextResponse } from "next/server";
import {
  adminGuard,
  fetchAllSessionsAdmin,
} from "@/survey-study/lib/adminServer";

// 대시보드 조회 전용 (service_role, RLS 우회). 서버에서만 실행.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = adminGuard(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }
  try {
    const sessions = await fetchAllSessionsAdmin();
    return NextResponse.json({ sessions });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
