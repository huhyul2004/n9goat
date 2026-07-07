import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWidgetToken } from "@/lib/widget-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 네비게이션형 위젯용 경량 요약 API.
// 상세 내용은 반환하지 않고, 각 카테고리에 "새(안 읽은) 항목이 있는지"만 알려준다.
// (위젯은 카테고리 이름 + 빨간 점 뱃지만 표시하고, 상세는 앱 화면에서 처리)
//
// 인증: 위젯 전용 장기 토큰(?token= 또는 Authorization: Bearer)이 필요.
//       토큰이 없거나 유효하지 않으면 401.

// "안 읽음" 판정은 별도 read-state 테이블이 없으므로,
// 최근 UNREAD_WINDOW_HOURS 시간 내에 새 항목이 생겼는지로 근사한다.
const UNREAD_WINDOW_HOURS = 24;

function getToken(req: NextRequest): string | null {
  const q = req.nextUrl.searchParams.get("token");
  if (q) return q;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function GET(request: NextRequest) {
  // 1) 인증
  const uid = verifyWidgetToken(getToken(request));
  if (!uid) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  // 2) Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }
  const supabase = createClient(url, key);

  const since = new Date(
    Date.now() - UNREAD_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  // 3) 카테고리별 "새 항목 있음?" 여부만 가볍게 확인 (head + count)
  async function hasRecent(
    table: string,
    category?: string
  ): Promise<boolean> {
    const base = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    const q = category ? base.eq("category", category) : base;
    const { count, error } = await q;
    if (error) return false;
    return (count ?? 0) > 0;
  }

  const [poll, notice, calendar, post] = await Promise.all([
    hasRecent("polls"),
    hasRecent("posts", "announcement"),
    hasRecent("calendar_events"),
    hasRecent("posts", "question"),
  ]);

  return NextResponse.json({
    poll: { hasUnread: poll },
    notice: { hasUnread: notice },
    calendar: { hasUnread: calendar },
    post: { hasUnread: post },
    updatedAt: new Date().toISOString(),
  });
}
