/**
 * 대시보드 & 주간 리포트 테스트용 가상 데이터 시드 스크립트
 * 실행: npx tsx scripts/seed-mock-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
  console.error("❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 필요");
  process.exit(1);
}

const supabase = createClient(url, key, {
  global: { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── 학교·직책·사람 ──
const SCHOOLS = [
  "신정중학교", "신일중학교", "학성중학교", "월평중학교", "동평중학교",
  "태화중학교", "울산강남중학교", "옥동중학교", "울산중앙중학교", "문수중학교",
  "울산서여자중학교", "야음중학교", "옥현중학교", "삼호중학교", "대현중학교", "무거중학교",
];
const ROLES = ["교장", "교감", "학생부장", "선생님", "학생회"];
const NAMES = ["김민수", "이서윤", "박지호", "정하윤", "최도윤", "강예은", "조현우", "윤수빈", "임서준", "한지유"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const s = [...arr].sort(() => Math.random() - 0.5);
  return s.slice(0, n);
}

function makeUser(school?: string, role?: string) {
  const s = school || pick(SCHOOLS);
  const r = role || pick(ROLES);
  const n = pick(NAMES);
  return { school: s, role: r, name: n, author_id: `${s}_${r}_${n}` };
}

// 이번 주 월요일~목요일(오늘) 범위 안의 랜덤 시각
function thisWeekDate(daysAgo = 0) {
  const d = new Date("2026-03-26T12:00:00+09:00");
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
  return d.toISOString();
}
// 1~3주 전 데이터
function olderDate() {
  const d = new Date("2026-03-26T12:00:00+09:00");
  d.setDate(d.getDate() - 7 - Math.floor(Math.random() * 14));
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
  return d.toISOString();
}

// ===================== POSTS (35개: 이번주 25, 과거 10) =====================
const POST_TITLES_Q = [
  "학생회 예산 집행 절차가 어떻게 되나요?",
  "체육대회 일정 변경 관련 문의드립니다",
  "급식 메뉴 건의는 어디서 하나요?",
  "방과후 프로그램 신청 마감일이 언제인가요?",
  "교복 규정 변경 논의가 필요합니다",
  "도서관 연장 개방 가능할까요?",
  "동아리 합동 발표회 준비 상황 공유해주세요",
  "학교 간 교류 행사 참가 인원 제한이 있나요?",
  "시험 기간 자습실 운영 시간 문의",
  "학생 자치회 회의록 열람은 어디서 하나요?",
  "교내 Wi-Fi 비밀번호 변경 안내 부탁드립니다",
  "졸업앨범 촬영 일정 확정되었나요?",
  "학교 축제 부스 신청 관련 질문입니다",
  "현장학습 버스 배정은 어떻게 되나요?",
  "학생증 재발급 절차 알려주세요",
];
const POST_TITLES_A = [
  "[공지] 2026학년도 1학기 학생회 임원 선거 일정 안내",
  "[공지] 학교 간 체육 교류전 참가 신청 안내",
  "[공지] 급식실 리모델링 공사 일정 안내",
  "[공지] 학부모 상담 주간 운영 안내",
  "[공지] 교내 코딩 대회 참가자 모집",
  "[공지] 봄 소풍 장소 투표 결과 안내",
  "[공지] 교복 하복 착용 시기 안내",
  "[공지] 학교폭력 예방 교육 일정",
  "[공지] 중간고사 시간표 발표",
  "[공지] N9 플랫폼 업데이트 안내",
];

const posts: Array<Record<string, unknown>> = [];
const postIds: string[] = [];

// 이번 주 질문 게시글 15개
for (let i = 0; i < 15; i++) {
  const u = makeUser();
  const id = crypto.randomUUID();
  postIds.push(id);
  posts.push({
    id,
    category: "question",
    title: POST_TITLES_Q[i % POST_TITLES_Q.length],
    content: `안녕하세요, ${u.school} ${u.role} ${u.name}입니다.\n\n${POST_TITLES_Q[i % POST_TITLES_Q.length]}에 대해 궁금합니다.\n답변 부탁드립니다.`,
    author_school: u.school,
    author_role: u.role,
    author_id: u.author_id,
    created_at: thisWeekDate(Math.floor(Math.random() * 4)),
  });
}

// 이번 주 공지 게시글 10개
for (let i = 0; i < 10; i++) {
  const u = makeUser(undefined, pick(["교장", "교감", "학생부장"]));
  const id = crypto.randomUUID();
  postIds.push(id);
  posts.push({
    id,
    category: "announcement",
    title: POST_TITLES_A[i],
    content: `${POST_TITLES_A[i]}\n\n해당 내용을 참고하시어 일정에 차질 없으시길 바랍니다.\n문의사항은 해당 부서로 연락 바랍니다.\n\n${u.school} ${u.role} ${u.name} 드림`,
    author_school: u.school,
    author_role: u.role,
    author_id: u.author_id,
    created_at: thisWeekDate(Math.floor(Math.random() * 4)),
  });
}

// 과거 게시글 10개
for (let i = 0; i < 10; i++) {
  const u = makeUser();
  const id = crypto.randomUUID();
  postIds.push(id);
  posts.push({
    id,
    category: pick(["question", "announcement"]),
    title: i < 5 ? `[지난주] ${POST_TITLES_Q[i]}` : `[지난주 공지] ${POST_TITLES_A[i - 5]}`,
    content: "지난주에 작성된 게시글입니다.",
    author_school: u.school,
    author_role: u.role,
    author_id: u.author_id,
    created_at: olderDate(),
  });
}

// ===================== COMMENTS (80개) =====================
const COMMENT_TEXTS = [
  "좋은 질문이네요! 저도 궁금했습니다.",
  "답변 감사합니다. 도움이 됐어요.",
  "우리 학교에서는 이렇게 진행하고 있습니다.",
  "공감합니다. 빨리 해결되면 좋겠네요.",
  "관련 자료 공유해주시면 감사하겠습니다.",
  "이 부분은 학생부장님께 문의하면 될 것 같아요.",
  "저도 같은 의견입니다!",
  "참고하겠습니다. 감사합니다.",
  "우리 학교도 비슷한 상황이에요.",
  "다음 회의에서 논의해보겠습니다.",
];

const comments: Array<Record<string, unknown>> = [];

// 인기 게시글용: 상위 5개 게시글에 댓글 많이 배정
const hotPostIds = postIds.slice(0, 5);
const hotCommentCounts = [12, 9, 7, 5, 4]; // 인기 순

for (let pi = 0; pi < hotPostIds.length; pi++) {
  for (let ci = 0; ci < hotCommentCounts[pi]; ci++) {
    const u = makeUser();
    comments.push({
      id: crypto.randomUUID(),
      post_id: hotPostIds[pi],
      content: pick(COMMENT_TEXTS),
      author_school: u.school,
      author_role: u.role,
      author_id: u.author_id,
      created_at: thisWeekDate(Math.floor(Math.random() * 4)),
    });
  }
}

// 나머지 게시글에 댓글 (0~3개씩)
for (let i = 5; i < postIds.length; i++) {
  const count = Math.floor(Math.random() * 4);
  for (let ci = 0; ci < count; ci++) {
    const u = makeUser();
    comments.push({
      id: crypto.randomUUID(),
      post_id: postIds[i],
      content: pick(COMMENT_TEXTS),
      author_school: u.school,
      author_role: u.role,
      author_id: u.author_id,
      created_at: thisWeekDate(Math.floor(Math.random() * 4)),
    });
  }
}

// ===================== POLLS (6개) =====================
const pollDefs = [
  { title: "봄 소풍 장소 투표", options: ["경주 보문단지", "울산대공원", "태화강 국가정원", "간절곶"], voterCount: 35 },
  { title: "체육대회 종목 추가 투표", options: ["피구", "줄다리기", "계주", "배드민턴", "축구"], voterCount: 28 },
  { title: "학교 축제 테마 선정", options: ["우주 탐험", "레트로 감성", "K-POP 페스티벌"], voterCount: 42 },
  { title: "급식 개선 희망 메뉴", options: ["치킨", "떡볶이", "피자", "햄버거", "초밥"], voterCount: 50 },
  { title: "방과후 희망 프로그램", options: ["코딩", "영어회화", "밴드", "요리", "운동"], voterCount: 22 },
  { title: "교복 자율화 찬반 투표", options: ["찬성", "반대", "부분 자율화"], voterCount: 38 },
];

const polls: Array<Record<string, unknown>> = [];

for (const pd of pollDefs) {
  const u = makeUser(undefined, pick(["학생회", "학생부장"]));
  const votes: Record<string, string> = {};
  for (let v = 0; v < pd.voterCount; v++) {
    const voter = makeUser();
    votes[voter.author_id + `_${v}`] = pick(pd.options);
  }
  const createdAt = thisWeekDate(Math.floor(Math.random() * 4));
  const expiresAt = new Date("2026-03-30T23:59:59+09:00").toISOString();
  polls.push({
    id: crypto.randomUUID(),
    title: pd.title,
    options: pd.options,
    votes,
    author_school: u.school,
    author_role: u.role,
    author_id: u.author_id,
    created_at: createdAt,
    expires_at: expiresAt,
  });
}

// ===================== CHAT MESSAGES (50개) =====================
const CHAT_CONTENTS = [
  "안녕하세요~ 오늘 회의 참석 가능한가요?",
  "네, 참석하겠습니다!",
  "체육대회 준비 잘 되고 있나요?",
  "우리 학교 학생회 회의 결과 공유드립니다",
  "다음 주 일정 확인 부탁드려요",
  "감사합니다 ^^",
  "혹시 자료 받으셨나요?",
  "네 확인했습니다",
  "회의록 올려놓았습니다",
  "수고하셨습니다!",
  "저도 동의합니다",
  "언제 시간 되시나요?",
  "이번 주 금요일 어떨까요?",
  "좋아요! 그때 뵙겠습니다",
  "공지 확인해주세요",
];

const chatMessages: Array<Record<string, unknown>> = [];
const chatRooms = ["전체", ...pickN(SCHOOLS, 8)];

for (let i = 0; i < 50; i++) {
  const room = pick(chatRooms);
  const u = room === "전체" ? makeUser() : makeUser(room);
  chatMessages.push({
    id: crypto.randomUUID(),
    room,
    content: pick(CHAT_CONTENTS),
    author_school: u.school,
    author_role: u.role,
    author_id: u.author_id,
    created_at: thisWeekDate(Math.floor(Math.random() * 4)),
  });
}

// ===================== CALENDAR EVENTS (12개) =====================
const eventDefs = [
  { title: "학생회 임원 선거", desc: "2026학년도 1학기 학생회 임원 선거 진행", date: "2026-03-27" },
  { title: "교내 코딩 대회", desc: "참가 신청 마감 후 대회 진행", date: "2026-03-28" },
  { title: "학교 간 체육 교류전", desc: "울산 지역 중학교 연합 체육대회", date: "2026-04-03" },
  { title: "봄 소풍", desc: "투표 결과에 따른 장소로 소풍 진행", date: "2026-04-10" },
  { title: "학부모 상담 주간", desc: "1학기 학부모 상담 주간 운영", date: "2026-04-07" },
  { title: "중간고사", desc: "1학기 중간고사 기간", date: "2026-04-21" },
  { title: "학교 축제", desc: "2026 학교 축제 개최", date: "2026-05-15" },
  { title: "교복 하복 전환", desc: "하복 착용 시작일", date: "2026-05-01" },
  { title: "동아리 합동 발표회", desc: "학교 간 동아리 합동 발표", date: "2026-04-18" },
  { title: "학교폭력 예방 교육", desc: "전교생 대상 교육 실시", date: "2026-03-31" },
  { title: "급식실 리모델링 완료", desc: "급식실 공사 완료 및 재개방", date: "2026-04-05" },
  { title: "N9 플랫폼 워크숍", desc: "N9 플랫폼 활용 교육", date: "2026-03-29" },
];

const calendarEvents: Array<Record<string, unknown>> = [];

for (const ev of eventDefs) {
  const u = makeUser(undefined, pick(["교장", "교감", "학생부장"]));
  calendarEvents.push({
    id: crypto.randomUUID(),
    title: ev.title,
    description: ev.desc,
    date: ev.date,
    author_school: u.school,
    author_role: u.role,
    author_id: u.author_id,
    created_at: thisWeekDate(Math.floor(Math.random() * 4)),
  });
}

// ===================== INSERT =====================
async function seed() {
  console.log("🌱 시드 데이터 삽입 시작...\n");

  // Posts
  const { error: postErr } = await supabase.from("posts").insert(posts);
  if (postErr) console.error("❌ posts:", postErr.message);
  else console.log(`✅ posts: ${posts.length}개 삽입`);

  // Comments
  const { error: commentErr } = await supabase.from("comments").insert(comments);
  if (commentErr) console.error("❌ comments:", commentErr.message);
  else console.log(`✅ comments: ${comments.length}개 삽입`);

  // Polls
  const { error: pollErr } = await supabase.from("polls").insert(polls);
  if (pollErr) console.error("❌ polls:", pollErr.message);
  else console.log(`✅ polls: ${polls.length}개 삽입`);

  // Chat messages
  const { error: chatErr } = await supabase.from("chat_messages").insert(chatMessages);
  if (chatErr) console.error("❌ chat_messages:", chatErr.message);
  else console.log(`✅ chat_messages: ${chatMessages.length}개 삽입`);

  // Calendar events
  const { error: eventErr } = await supabase.from("calendar_events").insert(calendarEvents);
  if (eventErr) console.error("❌ calendar_events:", eventErr.message);
  else console.log(`✅ calendar_events: ${calendarEvents.length}개 삽입`);

  console.log("\n📊 삽입 요약:");
  console.log(`  게시글: ${posts.length}개 (이번주 25 + 과거 10)`);
  console.log(`  댓글: ${comments.length}개 (인기 게시글에 집중 배분)`);
  console.log(`  투표: ${polls.length}개 (총 ${pollDefs.reduce((s, p) => s + p.voterCount, 0)}표)`);
  console.log(`  채팅: ${chatMessages.length}개`);
  console.log(`  일정: ${calendarEvents.length}개`);
  console.log("\n✨ 완료! 대시보드에서 확인하세요.");
}

seed().catch(console.error);
