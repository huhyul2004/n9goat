import { NextRequest, NextResponse } from "next/server";
import { callClaude, hasClaudeKey } from "@/lib/claude";

const QUESTION_PROMPT = `너는 울산 남구 중학교 커뮤니티 게시판의 글쓰기 도우미야.
사용자가 키워드나 간단한 문장을 입력하면, 그것을 바탕으로 게시판에 올릴 수 있는 완성된 글을 작성해줘.

규칙:
- 제목과 본문을 구분해서 작성해줘
- 첫 줄에 제목을 쓰고, 빈 줄 하나를 두고 본문을 작성해줘
- 존댓말을 사용하되 친근한 톤으로 작성해줘
- 중학교 커뮤니티에 맞는 적절한 어휘를 사용해줘
- 너무 길지 않게 핵심적으로 작성해줘
- 제목 앞에 "제목:" 같은 접두사는 붙이지 마`;

const ANNOUNCEMENT_PROMPT = `너는 울산 남구 중학교 커뮤니티의 공식 공지문 작성 도우미야.
사용자가 키워드나 간단한 설명을 입력하면, 격식 있고 깔끔한 공지문을 작성해줘.

규칙:
- 첫 줄에 공지 제목을 쓰고, 빈 줄 하나를 두고 본문을 작성해줘
- 공지문답게 격식체를 사용해줘
- 본문은 다음 구조로 작성해줘:
  1. 인사말 (한 줄)
  2. 핵심 안내 내용
  3. 세부 사항 (일시, 장소, 대상, 준비물 등 해당되는 항목)
  4. 마무리 (협조/참여 요청)
- 중요한 정보는 【】로 강조해줘
- 제목 앞에 "제목:" 같은 접두사는 붙이지 마
- 너무 길지 않게 핵심적으로 작성해줘`;

export async function POST(request: NextRequest) {
  try {
    const { keywords, type } = await request.json();
    const systemPrompt = type === "announcement" ? ANNOUNCEMENT_PROMPT : QUESTION_PROMPT;

    if (!hasClaudeKey()) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    if (!keywords || !keywords.trim()) {
      return NextResponse.json(
        { error: "키워드를 입력해주세요" },
        { status: 400 }
      );
    }

    const content = await callClaude({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            type === "announcement"
              ? `다음 내용을 바탕으로 공식 공지문을 작성해줘: ${keywords}`
              : `다음 키워드를 바탕으로 게시판 글을 작성해줘: ${keywords}`,
        },
      ],
      maxTokens: 1024,
    });

    // Split first line as title, rest as body
    const lines = content.split("\n");
    let title = "";
    let body = content;

    if (lines.length > 1) {
      title = lines[0].replace(/^#+\s*/, "").trim();
      body = lines.slice(1).join("\n").trim();
    }

    return NextResponse.json({ title, body });
  } catch (error) {
    console.error("AI write error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
