import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SOLAR_API_KEY = process.env.SOLAR_API_KEY;
const SOLAR_API_URL = "https://api.upstage.ai/v1/chat/completions";

const SYSTEM_PROMPT = `너는 울산 남구 중학교 커뮤니티 N9의 주간 브리핑 도우미야.
이번 주에 올라온 게시글, 공지사항, 투표, 일정 데이터를 분석해서 주간 요약 리포트를 작성해줘.

규칙:
- 반드시 아래 JSON 형식으로만 응답해줘 (다른 텍스트 없이 순수 JSON만):
{
  "summary": "이번 주 전체 요약 (2-3문장)",
  "highlights": [
    { "title": "항목 제목", "description": "설명", "priority": "high|medium|low", "category": "질문|공지|투표|일정" }
  ],
  "stats": {
    "total_posts": 숫자,
    "questions": 숫자,
    "announcements": 숫자,
    "polls": 숫자,
    "events": 숫자,
    "most_active_school": "학교이름",
    "hot_topics": ["주제1", "주제2", "주제3"]
  },
  "recommendations": ["추천 행동1", "추천 행동2"]
}
- highlights는 우선순위(priority) 순서대로 정렬해줘 (high → medium → low)
- 가장 중요하고 긴급한 내용은 high, 참고할 만한 내용은 medium, 일반적인 내용은 low
- 최대 8개까지만 선정해줘
- hot_topics는 자주 언급된 키워드 3개
- recommendations는 사용자가 확인하면 좋을 내용 2개`;

export async function POST(request: NextRequest) {
  try {
    if (!SOLAR_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(url, key);

    // 이번 주 시작 (월요일)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString();

    // 이번 주 데이터 병렬 조회
    const [postsRes, pollsRes, eventsRes] = await Promise.all([
      supabase.from("posts").select("*").gte("created_at", weekStart).order("created_at", { ascending: false }),
      supabase.from("polls").select("*").gte("created_at", weekStart).order("created_at", { ascending: false }),
      supabase.from("calendar_events").select("*").gte("created_at", weekStart).order("date", { ascending: true }),
    ]);

    const posts = postsRes.data || [];
    const polls = pollsRes.data || [];
    const events = eventsRes.data || [];

    if (posts.length === 0 && polls.length === 0 && events.length === 0) {
      return NextResponse.json({
        summary: "이번 주에는 아직 올라온 글이 없습니다.",
        highlights: [],
        stats: { total_posts: 0, questions: 0, announcements: 0, polls: 0, events: 0, most_active_school: "-", hot_topics: [] },
        recommendations: ["첫 글을 작성해보세요!"],
      });
    }

    // AI에게 보낼 데이터 요약
    const dataForAi = {
      posts: posts.map((p) => ({
        category: p.category,
        title: p.title,
        content: p.content?.substring(0, 100),
        school: p.author_school,
        role: p.author_role,
        date: p.created_at,
      })),
      polls: polls.map((p) => ({
        title: p.title,
        options: p.options,
        vote_count: Object.keys(p.votes || {}).length,
        school: p.author_school,
      })),
      events: events.map((e) => ({
        title: e.title,
        description: e.description?.substring(0, 100),
        date: e.date,
        school: e.author_school,
      })),
    };

    const response = await fetch(SOLAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SOLAR_API_KEY}`,
      },
      body: JSON.stringify({
        model: "solar-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `이번 주(${monday.toLocaleDateString("ko-KR")} ~ ${now.toLocaleDateString("ko-KR")}) 커뮤니티 데이터를 분석해줘:\n\n${JSON.stringify(dataForAi, null, 2)}` },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Solar API error: ${error}` }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // JSON 파싱 (코드 블록 제거)
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI weekly error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
