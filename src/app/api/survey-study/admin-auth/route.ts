import { NextResponse } from "next/server";

/**
 * 관리자 대시보드 비밀번호 검증.
 * 비밀번호는 환경변수 SURVEY_ADMIN_PASSWORD 에만 존재하며
 * 클라이언트 번들에 절대 포함되지 않는다.
 */
export async function POST(req: Request) {
  const expected = process.env.SURVEY_ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SURVEY_ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. .env.local에 추가하세요.",
      },
      { status: 500 }
    );
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    // body 없음 → 아래에서 불일치 처리
  }

  if (password === expected) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
