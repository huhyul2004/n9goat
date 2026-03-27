/**
 * 전체 캘린더 + 학교별 캘린더 가상 일정 시드
 * 실행: npx tsx scripts/seed-calendar.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!url || !key) { console.error("❌ env 설정 필요"); process.exit(1); }

const supabase = createClient(url, key, {
  global: { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  auth: { autoRefreshToken: false, persistSession: false },
});

const SCHOOLS = [
  "신정중학교", "신일중학교", "학성중학교", "월평중학교", "동평중학교",
  "태화중학교", "울산강남중학교", "옥동중학교", "울산중앙중학교", "문수중학교",
  "울산서여자중학교", "야음중학교", "옥현중학교", "삼호중학교", "대현중학교", "무거중학교",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const events: Array<Record<string, unknown>> = [];

// ═══════════════ 전체(교육감) 일정 — 30개 ═══════════════
const generalEvents = [
  // 3월
  { title: "울산 학생의회 제1차 정기회의", date: "2026-03-23", desc: "울산광역시 학생의회 정기회의" },
  { title: "N9 플랫폼 사용법 연수", date: "2026-03-24", desc: "전 학교 대상 N9 플랫폼 활용 교육" },
  { title: "학교폭력 예방 주간 시작", date: "2026-03-25", desc: "3.25~3.31 학교폭력 예방 주간" },
  { title: "교육감과의 대화", date: "2026-03-26", desc: "학생 대표와 교육감 간담회" },
  { title: "학생자치활동 워크숍", date: "2026-03-27", desc: "학생회 역량 강화 워크숍" },
  { title: "학교 간 체육 교류전 접수 마감", date: "2026-03-28", desc: "참가 신청 마감일" },
  { title: "교육감 주간 브리핑", date: "2026-03-30", desc: "주간 교육 현황 브리핑" },
  { title: "학교폭력 예방 교육 결과 보고", date: "2026-03-31", desc: "각 학교 예방 교육 결과 제출" },
  // 4월
  { title: "학교 간 체육 교류전", date: "2026-04-03", desc: "울산 지역 중학교 연합 체육대회" },
  { title: "학교 간 체육 교류전 2일차", date: "2026-04-04", desc: "결승전 및 시상식" },
  { title: "학부모 상담 주간", date: "2026-04-07", desc: "4.7~4.11 학부모 상담 주간" },
  { title: "학생 인권의 날", date: "2026-04-08", desc: "학생 인권 교육 및 캠페인" },
  { title: "봄 소풍", date: "2026-04-10", desc: "학교별 봄 소풍 실시" },
  { title: "과학의 날 기념 행사", date: "2026-04-14", desc: "울산 학생 과학 탐구 대회" },
  { title: "진로체험의 날", date: "2026-04-16", desc: "직업 체험 활동" },
  { title: "동아리 합동 발표회", date: "2026-04-18", desc: "학교 간 동아리 합동 발표" },
  { title: "중간고사 기간 시작", date: "2026-04-21", desc: "4.21~4.24 중간고사" },
  { title: "중간고사 기간 종료", date: "2026-04-24", desc: "중간고사 마지막 날" },
  { title: "지구의 날 환경 캠페인", date: "2026-04-22", desc: "전 학교 환경 정화 활동" },
  { title: "교육감 학교 방문 (신정중)", date: "2026-04-28", desc: "교육감 현장 방문" },
  { title: "교육감 학교 방문 (학성중)", date: "2026-04-29", desc: "교육감 현장 방문" },
  // 5월
  { title: "어린이날 대체 휴일", date: "2026-05-06", desc: "공휴일" },
  { title: "어버이날 감사 캠페인", date: "2026-05-08", desc: "전 학교 어버이날 행사" },
  { title: "스승의 날 행사", date: "2026-05-15", desc: "스승의 날 기념 행사" },
  { title: "학교 축제 주간 시작", date: "2026-05-18", desc: "5.18~5.22 학교 축제 주간" },
  { title: "학교 축제 주간 종료", date: "2026-05-22", desc: "축제 마무리 및 정리" },
  { title: "학생회 연합 회의", date: "2026-05-25", desc: "제2차 학생의회 연합 회의" },
  { title: "교내 코딩 대회", date: "2026-05-27", desc: "울산 지역 중학생 코딩 대회" },
  { title: "체력 검사 주간", date: "2026-05-28", desc: "5.28~6.1 학생 체력 검사" },
  { title: "6월 모의고사 안내", date: "2026-05-29", desc: "3학년 대상 모의고사 안내" },
];

for (const ev of generalEvents) {
  events.push({
    id: crypto.randomUUID(),
    title: ev.title,
    description: ev.desc,
    date: ev.date,
    author_school: "교육감",
    author_role: "교육감",
    author_id: "교육감_교육감_김철수",
    created_at: new Date("2026-03-20T09:00:00+09:00").toISOString(),
  });
}

// ═══════════════ 학교별 학사일정 — 학교당 8~12개 ═══════════════
const schoolEventTemplates = [
  // 3월
  { title: "개학식", date: "2026-03-02", desc: "2026학년도 1학기 개학" },
  { title: "반 편성 및 담임 배정", date: "2026-03-03", desc: "학급 편성 공지" },
  { title: "학생회 임원 선거", date: "2026-03-10", desc: "학생회장 및 부회장 선거" },
  { title: "전교 조회", date: "2026-03-17", desc: "3월 전교 조회" },
  { title: "학부모 총회", date: "2026-03-20", desc: "학부모 대상 학교 운영 설명회" },
  { title: "동아리 활동 시작", date: "2026-03-24", desc: "1학기 동아리 활동 개시" },
  { title: "학교폭력 예방 교육", date: "2026-03-26", desc: "전교생 대상 학교폭력 예방 교육" },
  // 4월
  { title: "학급 임원 선출", date: "2026-04-01", desc: "각 학급 임원 선출" },
  { title: "현장학습", date: "2026-04-09", desc: "학년별 현장 체험 학습" },
  { title: "학부모 상담 주간", date: "2026-04-07", desc: "학부모 개별 상담 운영" },
  { title: "교내 체육대회", date: "2026-04-15", desc: "학년별 체육대회 개최" },
  { title: "중간고사", date: "2026-04-21", desc: "1학기 중간고사 (4.21~4.24)" },
  { title: "자유학기제 진로탐색", date: "2026-04-28", desc: "1학년 진로 탐색 활동" },
  // 5월
  { title: "교복 하복 전환", date: "2026-05-01", desc: "하복 착용 시작" },
  { title: "어버이날 행사", date: "2026-05-08", desc: "감사 편지 쓰기 활동" },
  { title: "스승의 날 감사 행사", date: "2026-05-15", desc: "교사 감사 이벤트" },
  { title: "학교 축제", date: "2026-05-19", desc: "교내 축제 개최" },
  { title: "학교 축제 2일차", date: "2026-05-20", desc: "축제 부스 및 공연" },
  { title: "소방 훈련", date: "2026-05-22", desc: "화재 대피 훈련 실시" },
  { title: "교내 영어 말하기 대회", date: "2026-05-26", desc: "학년별 영어 대회" },
  { title: "봉사활동의 날", date: "2026-05-29", desc: "지역 사회 봉사활동" },
];

const NAMES = ["김영호", "박미정", "이상우", "정은희", "최재호", "한소영"];

for (const school of SCHOOLS) {
  // 각 학교마다 랜덤으로 8~12개 선택
  const count = 8 + Math.floor(Math.random() * 5);
  const shuffled = [...schoolEventTemplates].sort(() => Math.random() - 0.5).slice(0, count);

  // 날짜를 학교마다 약간 다르게 (±1~2일)
  for (const tmpl of shuffled) {
    const d = new Date(tmpl.date);
    const offset = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().slice(0, 10);

    const name = pick(NAMES);
    const role = pick(["교장", "교감", "학생부장"]);

    events.push({
      id: crypto.randomUUID(),
      title: tmpl.title,
      description: tmpl.desc,
      date: dateStr,
      author_school: school,
      author_role: role,
      author_id: `${school}_${role}_${name}`,
      created_at: new Date("2026-03-01T09:00:00+09:00").toISOString(),
    });
  }
}

async function seed() {
  console.log("🗓️  캘린더 시드 데이터 삽입 시작...\n");

  // 기존 시드 데이터 삭제 (기존 일정 유지하려면 주석 처리)
  await supabase.from("calendar_events").delete().gte("id", "00000000-0000-0000-0000-000000000000");

  const { error } = await supabase.from("calendar_events").insert(events);
  if (error) {
    console.error("❌ calendar_events:", error.message);
  } else {
    const generalCount = generalEvents.length;
    const schoolCount = events.length - generalCount;
    console.log(`✅ 전체(교육감) 일정: ${generalCount}개`);
    console.log(`✅ 학교별 학사일정: ${schoolCount}개 (${SCHOOLS.length}개 학교)`);
    console.log(`✅ 총 ${events.length}개 삽입 완료`);
  }

  console.log("\n✨ 완료! 캘린더에서 확인하세요.");
}

seed().catch(console.error);
