import { NextRequest, NextResponse } from "next/server";
import { callClaude, hasClaudeKey } from "@/lib/claude";

const SYSTEM_PROMPT = `너는 "허남구"라는 이름의 친절한 AI 도우미야.
울산광역시 남구 중학생들을 위한 챗봇이야.
학교생활, 학습, 진로, 고민 상담 등 중학생들이 궁금해하는 것들에 대해 친절하고 이해하기 쉽게 답변해줘.
반말보다는 존댓말을 사용하되, 너무 딱딱하지 않게 친근한 톤으로 대화해줘.
답변은 간결하고 핵심적으로 해줘.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!hasClaudeKey()) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const answer = await callClaude({
      system: SYSTEM_PROMPT,
      messages: messages,
      maxTokens: 1024,
    });

    return NextResponse.json({ message: answer });
  } catch (error) {
    console.error("Chatbot error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
