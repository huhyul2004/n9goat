import { NextRequest, NextResponse } from "next/server";
import { callClaude, hasClaudeKey } from "@/lib/claude";

const SYSTEM_PROMPT = `너는 울산 남구 중학교 커뮤니티 게시판의 콘텐츠 검수 도우미야.
사용자가 작성한 글의 제목과 본문을 확인하고, 비윤리적이거나 부적절한 내용이 있는지 판단해줘.

판단 기준 (가벼운 수위 — 너무 엄격하지 않게):
- 욕설, 비속어, 심한 혐오 표현
- 특정인에 대한 심한 비방, 따돌림, 사이버불링
- 음란물이나 성적으로 노골적인 내용
- 폭력을 조장하거나 자해/자살을 권유하는 내용
- 개인정보(전화번호, 주소 등) 무단 노출

판단하지 않아도 되는 것 (허용):
- 단순 불평이나 불만 표현
- 가벼운 농담이나 은어
- 비판적 의견 표현
- 일반적인 감정 표현 (짜증, 화남 등)

중요: 수정 제안을 할 때는 원본 글의 의미와 구조를 최대한 유지하면서 문제가 되는 부분만 순화해줘.
원본 글에 없는 내용을 추가하거나 글의 흐름을 바꾸지 마.

응답 형식 (반드시 JSON으로만 응답):
문제가 없으면: {"ok": true}
문제가 있으면: {"ok": false, "reason": "문제 이유를 간단히 설명", "suggested_title": "수정된 제목 (원본 제목에 문제가 없으면 원본 그대로)", "suggested_content": "수정된 본문 (문제가 되는 표현만 순화하고 나머지는 원본 그대로 유지)"}`;

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    if (!hasClaudeKey()) {
      // API 키가 없으면 그냥 통과
      return NextResponse.json({ ok: true });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ ok: true });
    }

    const raw = (
      await callClaude({
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `다음 글을 검수해줘:\n\n제목: ${title || "(없음)"}\n본문: ${content}`,
          },
        ],
        maxTokens: 512,
      })
    ).trim();

    // JSON 파싱 시도
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json(result);
      }
    } catch {
      // 파싱 실패 시 통과
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("AI moderate error:", error);
    return NextResponse.json({ ok: true });
  }
}
