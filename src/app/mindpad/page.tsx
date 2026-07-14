"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { useEffect } from "react";
import {
  Heart,
  Shield,
  Clock,
  Eye,
  EyeOff,
  MessageCircleHeart,
  MonitorSmartphone,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Phone,
} from "lucide-react";

const MINDPAD_URL = "https://mindpad-kr.vercel.app/";

export default function MindpadIntroPage() {
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
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-slate-900">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: EyeOff,
      title: "완전한 익명성",
      desc: "이름, 학번, IP 주소 등 개인정보를 일절 수집하지 않습니다. 누가 보냈는지 아무도 알 수 없어 안심하고 마음을 전할 수 있습니다.",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      icon: MonitorSmartphone,
      title: "디지털 패드",
      desc: "방치된 물리적 우체통 대신 복도에 설치된 디지털 패드로 운영됩니다. 웹 서비스가 상시 실행되어 언제든 접근할 수 있습니다.",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      icon: MessageCircleHeart,
      title: "고민 상담",
      desc: "학업, 교우 관계, 가정 등 어떤 고민이든 편하게 작성하세요. 전문 상담 선생님이 정성껏 답변해 드립니다.",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      icon: AlertTriangle,
      title: "학교폭력 제보",
      desc: "목격하거나 겪고 있는 학교폭력을 안전하게 제보할 수 있습니다. 긴급 건은 즉시 처리됩니다.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: Clock,
      title: "24시간 접수",
      desc: "시간 제한 없이 언제든 글을 남길 수 있습니다. 선생님이 확인하는 대로 빠르게 답변이 달립니다.",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Shield,
      title: "안전한 공간",
      desc: "작성된 내용은 담당 상담 선생님만 확인할 수 있으며, 비밀이 철저히 보장됩니다.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 text-white overflow-y-auto">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => router.push("/landing")}
          className="flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-700/50 text-slate-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          <span>N9으로 돌아가기</span>
        </button>
      </div>

      {/* Hero */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Heart size={40} className="text-rose-400" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              마음패드
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-white/90 mb-4">
            익명으로 전하는 나의 마음
          </p>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            방치된 물리적 우체통 대신 복도에 디지털 패드를 설치하고
            <br className="hidden md:block" />
            MindPad 웹 서비스를 상시 실행합니다.
            <br className="hidden md:block" />
            익명성이 보장된 편리한 인터페이스로 접근성을 높여
            <br className="hidden md:block" />
            학교폭력 제보와 고민 상담을 활성화하고 소통을 강화합니다.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-slate-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* 왜 마음패드인가 */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              왜 <span className="bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">마음패드</span>인가요?
            </h2>
            <p className="text-slate-400 text-lg">
              기존 우체통의 한계를 넘어, 더 안전하고 편리한 소통을 만듭니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Before */}
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye size={20} className="text-slate-500" />
                <h3 className="text-lg font-bold text-slate-400">기존 우체통</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex gap-2">
                  <span className="text-slate-600">-</span>
                  복도 구석에 방치되어 접근이 어려움
                </li>
                <li className="flex gap-2">
                  <span className="text-slate-600">-</span>
                  편지를 넣는 모습이 노출될 우려
                </li>
                <li className="flex gap-2">
                  <span className="text-slate-600">-</span>
                  확인 주기가 불규칙하여 대응 지연
                </li>
                <li className="flex gap-2">
                  <span className="text-slate-600">-</span>
                  답변을 받을 수 있는 방법이 없음
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart size={20} className="text-rose-400" />
                <h3 className="text-lg font-bold text-rose-300">마음패드</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-rose-400">+</span>
                  디지털 패드로 누구나 쉽게 접근
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400">+</span>
                  완전한 익명성으로 안심하고 작성
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400">+</span>
                  실시간 알림으로 신속한 대응
                </li>
                <li className="flex gap-2">
                  <span className="text-rose-400">+</span>
                  선생님의 답변을 바로 확인 가능
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              주요 기능
            </h2>
            <p className="text-slate-400 text-lg">
              안전하고 편리한 소통을 위한 모든 것
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
                  <f.icon size={24} className={f.color} />
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

      {/* 긴급 연락처 */}
      <section className="px-6 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <Phone size={28} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-red-300">긴급 상황이라면</h3>
            <p className="text-sm text-slate-400 mb-4">
              지금 당장 도움이 필요하다면, 아래 번호로 연락해 주세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-red-500/10 px-4 py-2 rounded-full text-red-300 font-medium">
                117 (학교폭력 신고)
              </span>
              <span className="bg-red-500/10 px-4 py-2 rounded-full text-red-300 font-medium">
                1388 (청소년 상담)
              </span>
              <span className="bg-red-500/10 px-4 py-2 rounded-full text-red-300 font-medium">
                112 (긴급 신고)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="px-6 py-12 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-slate-600">
            &copy; 2026 MindPad. N9 Community 제공
          </p>
        </div>
      </section>

      {/* 시작하기 FAB */}
      <a
        href={MINDPAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold py-3.5 px-7 rounded-full shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all hover:scale-105 active:scale-95 no-underline"
        style={{ marginBottom: "max(0px, env(safe-area-inset-bottom))" }}
      >
        <span>시작하기</span>
        <ArrowRight size={18} />
      </a>
    </div>
  );
}
