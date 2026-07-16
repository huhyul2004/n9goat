import type { Metadata } from "next";

// survey-study 전용 메타데이터 (N9 루트 레이아웃 위에 덧씌움)
// [내부 원칙] 브라우저 탭 제목에도 조사 설계 단서를 노출하지 않는다.
export const metadata: Metadata = {
  title: "생활 만족도 의견 조사",
  description: "학교(기관) 생활 만족도에 대한 간단한 의견 조사",
};

/**
 * survey-study 영역 전용 레이아웃.
 * 불투명한 배경 + 독립 stacking context로 N9의 배경 워터마크가
 * 설문 화면에 비치지 않도록 하고, 시각적으로 완전히 분리한다.
 */
export default function SurveyStudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 min-h-screen bg-slate-50 text-slate-900">
      {children}
    </div>
  );
}
