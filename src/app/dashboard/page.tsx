"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { fetchDashboardStats } from "@/lib/db";
import type { Poll } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import WeeklySummary from "@/components/WeeklySummary";
import { SCHOOL_LIST } from "@/lib/constants";
import {
  LayoutDashboard, TrendingUp, Users, MessageSquare, BarChart3,
  FileText, CalendarDays, MessagesSquare, Crown, Flame, RefreshCw,
  Newspaper, ChevronRight, Trophy, Medal, Award, Loader2,
} from "lucide-react";


interface DashboardData {
  totalPosts: number;
  totalComments: number;
  totalPolls: number;
  totalEvents: number;
  todayPosts: number;
  weekPosts: number;
  weekComments: number;
  weekChats: number;
  weeklyActiveUsers: number;
  popularPosts: {
    id: string;
    title: string;
    author_school: string;
    author_id: string;
    category: string;
    created_at: string;
    comment_count: number;
  }[];
  schoolActivity: Record<string, { posts: number; comments: number; chats: number }>;
  polls: Poll[];
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await fetchDashboardStats();
      setData(stats as DashboardData);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("[Dashboard] load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // 30초마다 새로고침
    return () => clearInterval(interval);
  }, [load]);

  if (!user) {
    return (
      <div className="flex h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LayoutDashboard size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-bold text-slate-600">로그인이 필요합니다</p>
          </div>
        </main>
      </div>
    );
  }

  // School activity sorted by total activity
  const schoolRanking = data
    ? Object.entries(data.schoolActivity)
        .map(([school, stats]) => ({ school, total: stats.posts + stats.comments + stats.chats, ...stats }))
        .sort((a, b) => b.total - a.total)
    : [];

  const maxSchoolActivity = schoolRanking.length > 0 ? schoolRanking[0].total : 1;

  // Poll stats
  const activePolls = data?.polls || [];
  const topPolls = activePolls
    .map((p) => ({ ...p, totalVotes: Object.keys(p.votes || {}).length }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 5);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto p-3 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <LayoutDashboard className="text-indigo-600" size={24} />
                Dashboard
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lastUpdated ? `마지막 업데이트: ${lastUpdated.toLocaleTimeString("ko-KR")}` : "로딩 중..."}
                <span className="ml-2 text-slate-300">30초마다 자동 갱신</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeeklyOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                <Newspaper size={16} />
                <span className="hidden md:inline">AI 주간 요약</span>
                <span className="md:hidden">AI</span>
              </button>
              <button
                onClick={load}
                disabled={loading}
                className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-500"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={36} className="text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">통계를 불러오는 중...</p>
            </div>
          ) : data ? (
            <>
              {/* ===== 실시간 통계 카드 ===== */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: "오늘 게시글", value: data.todayPosts, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50", accent: "border-indigo-200" },
                  { label: "이번 주 글", value: data.weekPosts, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", accent: "border-emerald-200" },
                  { label: "이번 주 댓글", value: data.weekComments, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50", accent: "border-amber-200" },
                  { label: "이번 주 채팅", value: data.weekChats, icon: MessagesSquare, color: "text-rose-600", bg: "bg-rose-50", accent: "border-rose-200" },
                  { label: "활동 사용자", value: data.weeklyActiveUsers, icon: Users, color: "text-purple-600", bg: "bg-purple-50", accent: "border-purple-200" },
                ].map((stat) => (
                  <div key={stat.label} className={`${stat.bg} border ${stat.accent} rounded-2xl p-4 transition-transform hover:scale-[1.02]`}>
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-[11px] font-medium text-slate-500">{stat.label}</span>
                    </div>
                    <p className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* ===== 누적 통계 ===== */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { label: "전체 게시글", value: data.totalPosts, color: "text-slate-700" },
                  { label: "전체 댓글", value: data.totalComments, color: "text-slate-700" },
                  { label: "전체 투표", value: data.totalPolls, color: "text-slate-700" },
                  { label: "전체 일정", value: data.totalEvents, color: "text-slate-700" },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                    <p className={`text-xl md:text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* ===== 인기 게시물 랭킹 ===== */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Flame size={18} className="text-orange-500" />
                    인기 게시물 TOP 5
                  </h3>
                  {data.popularPosts.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">아직 게시물이 없습니다</p>
                  ) : (
                    <div className="space-y-2">
                      {data.popularPosts.map((post, i) => {
                        const RankIcon = i === 0 ? Trophy : i === 1 ? Medal : i === 2 ? Award : ChevronRight;
                        const rankColor = i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-slate-300";
                        return (
                          <div
                            key={post.id}
                            onClick={() => router.push(`/board?post=${post.id}`)}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${i < 3 ? "bg-slate-50" : ""}`}>
                              <RankIcon size={i < 3 ? 20 : 16} className={rankColor} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{post.title}</p>
                              <p className="text-[10px] text-slate-400">
                                {post.author_school} · {post.category === "announcement" ? "공지" : "질문"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <MessageSquare size={12} className="text-indigo-400" />
                              <span className="text-sm font-bold text-indigo-600">{post.comment_count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ===== 투표 현황 그래프 ===== */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-500" />
                    투표 현황
                  </h3>
                  {topPolls.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">진행 중인 투표가 없습니다</p>
                  ) : (
                    <div className="space-y-4">
                      {topPolls.map((poll) => {
                        const optionVotes: Record<string, number> = {};
                        poll.options.forEach((o) => (optionVotes[o] = 0));
                        Object.values(poll.votes || {}).forEach((v) => {
                          if (optionVotes[v] !== undefined) optionVotes[v]++;
                        });
                        const maxVote = Math.max(1, ...Object.values(optionVotes));

                        return (
                          <div key={poll.id}>
                            <p className="text-xs font-bold text-slate-700 mb-2 truncate">{poll.title}</p>
                            <div className="space-y-1.5">
                              {poll.options.map((opt) => {
                                const count = optionVotes[opt] || 0;
                                const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
                                const barWidth = Math.max(2, (count / maxVote) * 100);
                                return (
                                  <div key={opt} className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 w-16 truncate flex-shrink-0">{opt}</span>
                                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden relative">
                                      <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-700"
                                        style={{ width: `${barWidth}%` }}
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600">
                                        {count}표 ({pct}%)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 text-right">총 {poll.totalVotes}명 참여</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ===== 학교별 활동 통계 ===== */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Crown size={18} className="text-amber-500" />
                  학교별 활동 통계 <span className="text-[10px] font-normal text-slate-400">(이번 주)</span>
                </h3>
                {schoolRanking.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">이번 주 활동 데이터가 없습니다</p>
                ) : (
                  <div className="space-y-2.5">
                    {schoolRanking.map((school, i) => {
                      const barWidth = Math.max(3, (school.total / maxSchoolActivity) * 100);
                      const isTop = i < 3;
                      const medalColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];
                      return (
                        <div key={school.school} className="flex items-center gap-3">
                          <div className="w-6 text-center flex-shrink-0">
                            {isTop ? (
                              <span className={`text-sm font-black ${medalColors[i]}`}>{i + 1}</span>
                            ) : (
                              <span className="text-xs text-slate-300 font-bold">{i + 1}</span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-slate-700 w-28 md:w-36 truncate flex-shrink-0">
                            {school.school}
                          </span>
                          <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                i === 0 ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                                : i === 1 ? "bg-gradient-to-r from-slate-400 to-slate-300"
                                : i === 2 ? "bg-gradient-to-r from-amber-600 to-amber-400"
                                : "bg-gradient-to-r from-indigo-400 to-indigo-300"
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-end pr-2 gap-2">
                              <span className="text-[10px] text-slate-500">
                                글 {school.posts} · 댓글 {school.comments} · 채팅 {school.chats}
                              </span>
                              <span className="text-xs font-bold text-slate-700">{school.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ===== 학교 참여율 히트맵 ===== */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-purple-500" />
                  학교 참여 현황
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SCHOOL_LIST.map((school) => {
                    const activity = data.schoolActivity[school];
                    const total = activity ? activity.posts + activity.comments + activity.chats : 0;
                    const intensity = maxSchoolActivity > 0 ? total / maxSchoolActivity : 0;
                    const bgColor = total === 0
                      ? "bg-slate-50 border-slate-100"
                      : intensity > 0.7
                      ? "bg-indigo-100 border-indigo-200"
                      : intensity > 0.3
                      ? "bg-indigo-50 border-indigo-100"
                      : "bg-blue-50 border-blue-100";
                    return (
                      <div key={school} className={`${bgColor} border rounded-xl p-3 text-center transition-all`}>
                        <p className="text-xs font-bold text-slate-700 truncate">{school.replace("중학교", "중")}</p>
                        <p className={`text-lg font-black mt-1 ${total > 0 ? "text-indigo-600" : "text-slate-300"}`}>{total}</p>
                        <p className="text-[9px] text-slate-400">활동</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>

      {/* AI 주간 요약 팝업 */}
      <WeeklySummary open={weeklyOpen} onClose={() => setWeeklyOpen(false)} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
