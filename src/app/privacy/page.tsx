export const metadata = {
  title: "개인정보처리방침 | N9",
  description: "N9 개인정보처리방침",
};

// Google Play 심사 및 이용자 안내용 개인정보처리방침.
// 새 공개 페이지(로그인 불필요) — 기존 N9 코드와 독립.
export default function PrivacyPage() {
  const updated = "2026-07-08";
  const contact = "huhyul2004@gmail.com";

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-slate-800">
      <h1 className="mb-1 text-2xl font-bold">개인정보처리방침</h1>
      <p className="mb-8 text-sm text-slate-500">
        최종 업데이트: {updated}
      </p>

      <section className="space-y-6 text-[15px] leading-relaxed">
        <p>
          N9(이하 “서비스”)는 울산 남구 지역 중학교 학생들을 위한 커뮤니티
          서비스입니다. 본 방침은 서비스가 수집하는 정보와 그 이용·보관 방식을
          설명합니다.
        </p>

        <div>
          <h2 className="mb-2 text-lg font-semibold">1. 수집하는 정보</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>계정 정보: 이름, 전화번호, 소속 학교, 역할(학생/교사 등)</li>
            <li>
              이용자가 작성한 콘텐츠: 게시글, 댓글, 쪽지, 채팅, 투표·설문 응답,
              프로필(자기소개) 등
            </li>
            <li>서비스 이용 과정에서 생성되는 활동 기록</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">2. 이용 목적</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>커뮤니티 기능(게시판·쪽지·채팅·투표·일정 등) 제공</li>
            <li>회원 식별 및 부적절한 콘텐츠 관리</li>
            <li>AI 도우미(챗봇)·AI 글쓰기·주간 요약 등 부가 기능 제공</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">3. 제3자 처리 위탁</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              데이터 저장: Supabase(클라우드 데이터베이스)에 안전하게 저장됩니다.
            </li>
            <li>
              AI 기능: 챗봇 등 AI 기능 사용 시 입력한 내용이 응답 생성을 위해
              Anthropic(Claude API)으로 전송·처리될 수 있습니다.
            </li>
            <li>
              위 업체 외 제3자에게 개인정보를 판매하거나 광고 목적으로 제공하지
              않습니다.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">4. 아동·청소년 보호</h2>
          <p>
            본 서비스는 중학생을 주 이용 대상으로 합니다. 만 14세 미만 아동의
            개인정보는 관련 법령에 따라 법정대리인의 동의가 필요할 수 있으며,
            민감정보는 수집하지 않습니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">5. 보관 및 파기</h2>
          <p>
            개인정보는 서비스 제공에 필요한 기간 동안 보관하며, 회원 탈퇴 또는
            삭제 요청 시 지체 없이 파기합니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">6. 이용자의 권리</h2>
          <p>
            이용자는 자신의 개인정보 열람·수정·삭제를 요청할 수 있으며, 앱 내
            프로필 화면 또는 아래 연락처를 통해 요청할 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">7. 문의처</h2>
          <p>
            개인정보 관련 문의:{" "}
            <a
              href={`mailto:${contact}`}
              className="text-indigo-600 underline"
            >
              {contact}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
