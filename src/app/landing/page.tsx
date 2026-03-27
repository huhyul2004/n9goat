"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MessageSquare,
  Mail,
  MessagesSquare,
  CalendarDays,
  BarChart3,
  Shield,
  Sparkles,
  Users,
  ArrowRight,
  School,
  Zap,
  Globe,
} from "lucide-react";

const SchoolMap = dynamic(() => import("@/components/SchoolMap"), { ssr: false });

export default function LandingPage() {
  const { user, initialized, init } = useAuth();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login");
    }
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: MessageSquare,
      title: "Q&A 게시판",
      desc: "학교 간 질문과 답변을 나누고, 공지사항을 확인하세요.",
      color: "from-indigo-500 to-blue-500",
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
    },
    {
      icon: Mail,
      title: "쪽지",
      desc: "다른 학교 구성원에게 직접 메시지를 보내보세요.",
      color: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
    },
    {
      icon: MessagesSquare,
      title: "실시간 채팅",
      desc: "학교별 채팅방과 단톡방으로 실시간 소통하세요.",
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
    {
      icon: CalendarDays,
      title: "일정 관리",
      desc: "학교 행사와 일정을 캘린더로 한눈에 관리하세요.",
      color: "from-rose-500 to-pink-500",
      bg: "bg-rose-500/10",
      text: "text-rose-400",
    },
    {
      icon: BarChart3,
      title: "투표",
      desc: "설문조사와 투표로 의견을 모으고 결정하세요.",
      color: "from-violet-500 to-purple-500",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
    },
    {
      icon: Sparkles,
      title: "AI 글쓰기",
      desc: "AI가 공지문 작성을 도와드립니다.",
      color: "from-cyan-500 to-sky-500",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
    },
  ];

  const highlights = [
    { icon: School, value: "16", label: "참여 학교", color: "text-indigo-400" },
    { icon: Users, value: "7", label: "직책 지원", color: "text-emerald-400" },
    { icon: Zap, value: "실시간", label: "소통 가능", color: "text-amber-400" },
    { icon: Globe, value: "남구", label: "교육 네트워크", color: "text-rose-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-y-auto">
      {/* Hero */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-sm text-indigo-300 font-medium">
              {user.name}님, 환영합니다
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              N9
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
            울산 남구 중학교 커뮤니티
          </p>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            16개 중학교가 하나로 연결됩니다.
            <br />
            질문하고, 소통하고, 함께 성장하세요.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-slate-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {highlights.map((h) => (
            <div
              key={h.label}
              className="bg-slate-800/50 border border-slate-700/50 backdrop-blur rounded-2xl p-5 md:p-6 text-center group hover:bg-slate-800 transition-colors"
            >
              <h.icon
                size={24}
                className={`${h.color} mx-auto mb-3 group-hover:scale-110 transition-transform`}
              />
              <p className={`text-3xl md:text-4xl font-black ${h.color}`}>
                {h.value}
              </p>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {h.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              모든 기능을 한곳에서
            </h2>
            <p className="text-slate-400 text-lg">
              소통에 필요한 모든 도구가 준비되어 있습니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6 hover:bg-slate-800/60 transition-all group"
              >
                <div
                  className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <f.icon size={24} className={f.text} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 16개 학교가 하나로 + 남구 지도 */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* 지도 */}
          <div className="w-full md:w-1/2 flex-shrink-0">
            <SchoolMap className="border border-slate-700/40 shadow-lg shadow-indigo-500/10" />
          </div>

          {/* 텍스트 */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">16개 학교</span>가
              <br />
              하나로
            </h2>
            <p className="text-lg md:text-xl text-slate-400 mt-6 leading-relaxed">
              울산 남구의 모든 중학교가<br />
              하나의 플랫폼에서 소통합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="px-6 py-12 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-600">
            &copy; 2026 N9 Community. 울산광역시 남구 교육 네트워크
          </p>
        </div>
      </section>

      {/* 시작하기 FAB */}
      <button
        onClick={() => {
          localStorage.setItem("n9_landing_seen", "true");
          router.push("/board");
        }}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3.5 px-7 rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:scale-105 active:scale-95"
        style={{ marginBottom: "max(0px, env(safe-area-inset-bottom))" }}
      >
        <span>시작하기</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
