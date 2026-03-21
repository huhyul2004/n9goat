// 시드 데이터 — 로컬 mock mode 전용
// 테스트 데이터 없이 빈 상태로 시작

const SEED_KEY = "n9_mock_seeded";

export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;

  // 빈 테이블 초기화
  localStorage.setItem("n9_mock_profiles", "[]");
  localStorage.setItem("n9_mock_posts", "[]");
  localStorage.setItem("n9_mock_comments", "[]");
  localStorage.setItem("n9_mock_chat_messages", "[]");
  localStorage.setItem("n9_mock_calendar_events", "[]");
  localStorage.setItem("n9_mock_polls", "[]");
  localStorage.setItem("n9_mock_mails", "[]");
  localStorage.setItem("n9_mock_invite_codes", "[]");
  localStorage.setItem(SEED_KEY, "true");
}
