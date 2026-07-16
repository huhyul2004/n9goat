import Anthropic from "@anthropic-ai/sdk";

// N9의 AI 기능 공용 Claude 호출 래퍼
// (기존 Upstage Solar API가 크레딧 소진으로 정지되어 Claude로 전환)
//
// 비용을 줄이려면 아래 모델만 바꾸면 돼요:
//   - "claude-haiku-4-5"  → 가장 저렴/빠름 (챗봇·검수 같은 대량 호출에 추천)
//   - "claude-sonnet-5"   → 중간
//   - "claude-opus-4-8"   → 최고 품질
export const CLAUDE_MODEL = "claude-haiku-4-5";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Set it in .env.local (local) and Vercel 환경변수 (production)."
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export function hasClaudeKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Claude Messages API 호출 → 응답 텍스트 반환.
 * system은 top-level 파라미터, 대화는 user/assistant 메시지 배열.
 */
export async function callClaude(opts: {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: opts.messages,
  });
  const textBlock = message.content.find((b) => b.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "";
}
