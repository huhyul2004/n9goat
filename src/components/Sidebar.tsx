"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/store/useToast";
import { getUnreadMailCount, getNewCommentCountOnMyPosts, markCommentsSeen } from "@/lib/db";
import { ANNOUNCEMENT_ROLES } from "@/lib/constants";
import { useSettings } from "@/store/useSettings";
import WeeklySummary from "./WeeklySummary";
import { AdBannerSidebar } from "./AdBanner";
import {
  MessageSquare,
  Mail,
  User,
  LogOut,
  CalendarDays,
  MessagesSquare,
  BarChart3,
  LayoutDashboard,
  Settings,
  X,
  Newspaper,
  Heart,
  ClipboardList,
} from "lucide-react";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [mailCount, setMailCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const prevMailCount = useRef(0);
  const prevCommentCount = useRef(0);
  const { avatar, init: initSettings } = useSettings();

  useEffect(() => { initSettings(); }, [initSettings]);

  const isAdmin = user && ANNOUNCEMENT_ROLES.includes(user.role);

  const loadCounts = useCallback(async () => {
    if (!user) return;
    const [mc, cc] = await Promise.all([
      getUnreadMailCount(user.id),
      getNewCommentCountOnMyPosts(user.id),
    ]);

    if (mc > prevMailCount.current && prevMailCount.current >= 0) {
      const diff = mc - prevMailCount.current;
      if (prevMailCount.current > 0) {
        toast.add(`새 메일이 ${diff}통 도착했습니다`);
      }
    }
    if (cc > prevCommentCount.current && prevCommentCount.current >= 0) {
      const diff = cc - prevCommentCount.current;
      if (prevCommentCount.current > 0) {
        toast.add(`내 글에 새 댓글이 ${diff}개 달렸습니다`);
      }
    }

    prevMailCount.current = mc;
    prevCommentCount.current = cc;
    setMailCount(mc);
    setCommentCount(cc);
  }, [user, toast]);

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 5000);
    return () => clearInterval(interval);
  }, [loadCounts]);

  useEffect(() => {
    if (pathname.startsWith("/board") && user) {
      markCommentsSeen(user.id);
      setCommentCount(0);
      prevCommentCount.current = 0;
    }
    loadCounts();
  }, [pathname, user, loadCounts]);

  if (!user) return null;

  const DASHBOARD_ROLES = ["교육감", "교장", "교감", "개발자", "학생부장", "선생님", "학생회"];
  const showDashboard = user && DASHBOARD_ROLES.includes(user.role);

  // 설문연구: 연구자/관리자는 대시보드로, 일반 사용자는 응답 페이지로
  const surveyHref = showDashboard ? "/survey-study/dashboard" : "/survey-study";

  const currentMatch = pathname.startsWith("/dashboard")
    ? "dashboard"
    : pathname.startsWith("/mail")
    ? "mail"
    : pathname.startsWith("/chat")
    ? "chat"
    : pathname.startsWith("/calendar")
    ? "calendar"
    : pathname.startsWith("/poll")
    ? "poll"
    : pathname.startsWith("/profile")
    ? "profile"
    : pathname.startsWith("/admin")
    ? "admin"
    : "board";

  const NAV_ITEMS = [
    { href: "/board", match: "board", icon: MessageSquare, label: "Question", badge: commentCount },
    { href: "/mail", match: "mail", icon: Mail, label: "Mail", badge: mailCount },
    { href: "/chat", match: "chat", icon: MessagesSquare, label: "Chat", badge: 0 },
    { href: "/calendar", match: "calendar", icon: CalendarDays, label: "Calendar", badge: 0 },
    { href: "/poll", match: "poll", icon: BarChart3, label: "Poll", badge: 0 },
    ...(showDashboard ? [{ href: "/dashboard", match: "dashboard", icon: LayoutDashboard, label: "Dashboard", badge: 0 }] : []),
  ];

  // 모바일 하단 네비: 최대 5개만 표시 (Dashboard는 더보기로)
  const MOBILE_NAV = NAV_ITEMS.slice(0, 5);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-64 bg-slate-900 flex-col flex-shrink-0">
        <button
          onClick={() => router.push("/landing")}
          className="px-6 py-6 mb-2 text-left hover:bg-slate-800/50 transition-colors"
        >
          <h1 className="text-2xl font-black text-white tracking-tight">N9</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">울산 남구 중학교 커뮤니티</p>
        </button>

        <div className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = currentMatch === item.match;
            return (
              <button
                key={item.match}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-sm ${
                  active
                    ? "text-white bg-indigo-600 font-bold shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
                }`}
              >
                <div className="relative">
                  <item.icon size={20} />
                  <Badge count={item.badge} />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* 설문연구 버튼 (수학·정보 탐구 프로젝트) */}
          <button
            onClick={() => router.push(surveyHref)}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-sm ${
              pathname.startsWith("/survey-study")
                ? "text-white bg-indigo-600 font-bold shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
            }`}
          >
            <ClipboardList size={20} />
            <span className="flex-1 text-left">설문연구</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">NEW</span>
          </button>

          {/* 마음패드 버튼 */}
          <button
            onClick={() => router.push("/mindpad")}
            className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-sm font-medium mt-2 border-t border-slate-700/50 pt-4 ${
              pathname.startsWith("/mindpad")
                ? "text-rose-300 bg-rose-500/10"
                : "text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
            }`}
          >
            <Heart size={20} />
            <span className="flex-1 text-left">마음패드</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">NEW</span>
          </button>

          {/* 주간 브리핑 버튼 */}
          <button
            onClick={() => setWeeklyOpen(true)}
            className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-sm text-slate-400 hover:text-white hover:bg-slate-800 font-medium"
          >
            <Newspaper size={20} />
            <span className="flex-1 text-left">주간 브리핑</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">AI</span>
          </button>
        </div>

        <AdBannerSidebar />

        <div className="mt-auto pt-4 pb-4 px-3 border-t border-slate-700/50">
          <button
            onClick={() => router.push("/profile")}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
              currentMatch === "profile" ? "bg-slate-800" : "hover:bg-slate-800"
            }`}
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="text-left flex-1">
              <p className="text-sm font-bold text-white">{user.name}</p>
              <p className="text-xs text-slate-500">{user.school} {user.role}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around z-50 p-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}>
        {MOBILE_NAV.map((item) => {
          const active = currentMatch === item.match;
          return (
            <button
              key={item.match}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
                active ? "text-indigo-600 font-bold" : "text-slate-400 font-medium"
              }`}
            >
              <div className="relative">
                <item.icon size={20} />
                <Badge count={item.badge} />
              </div>
              <span className="text-[9px]">{item.label}</span>
            </button>
          );
        })}
        {/* Mobile profile/settings button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
            currentMatch === "profile" ? "text-indigo-600 font-bold" : "text-slate-400 font-medium"
          }`}
        >
          <Settings size={20} />
          <span className="text-[9px]">더보기</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">설정</h3>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-500">{user.school} {user.role}</p>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => { router.push("/profile"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <User size={20} />
                <span className="text-sm font-medium">내 프로필</span>
              </button>

              {showDashboard && (
                <button
                  onClick={() => { router.push("/dashboard"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <LayoutDashboard size={20} />
                  <span className="text-sm font-medium">대시보드</span>
                </button>
              )}

              <button
                onClick={() => { router.push(surveyHref); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-slate-700 transition-colors"
              >
                <ClipboardList size={20} className="text-emerald-600" />
                <span className="text-sm font-medium flex-1 text-left">설문연구</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">NEW</span>
              </button>

              <button
                onClick={() => { router.push("/mindpad"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-slate-700 transition-colors"
              >
                <Heart size={20} className="text-rose-500" />
                <span className="text-sm font-medium flex-1 text-left">마음패드</span>
                <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">NEW</span>
              </button>

              <button
                onClick={() => { setWeeklyOpen(true); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 text-slate-700 transition-colors"
              >
                <Newspaper size={20} />
                <span className="text-sm font-medium flex-1 text-left">주간 브리핑</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">AI</span>
              </button>

              <div className="border-t border-slate-100 my-2" />

              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 주간 브리핑 팝업 */}
      <WeeklySummary open={weeklyOpen} onClose={() => setWeeklyOpen(false)} />
    </>
  );
}
