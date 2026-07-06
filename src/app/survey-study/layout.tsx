import type { Metadata } from "next";

// survey-study 전용 메타데이터 (N9 루트 레이아웃 위에 덧씌움)
export const metadata: Metadata = {
  title: "설문 응답 방식 비교 연구",
  description: "응답 방식(척도)에 따른 설문 응답 편향 비교 연구",
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
