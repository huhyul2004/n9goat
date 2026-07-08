"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, AlertCircle, Info, ChevronRight, BarChart3, Flame, Lightbulb, Loader2 } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface Highlight {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
}

interface Stats {
  total_posts: number;
  questions: number;
  announcements: number;
  polls: number;
  events: number;
  most_active_school: string;
  hot_topics: string[];
}

interface WeeklyData {
  summary: string;
  highlights: Highlight[];
  stats: Stats;
  recommendations: string[];
}

const PRIORITY_CONFIG = {
  high: { color: "bg-red-500", border: "border-red-200", bg: "bg-red-50", text: "text-red-700", label: "긴급" },
  medium: { color: "bg-amber-500", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", label: "중요" },
  low: { color: "bg-blue-500", border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-700", label: "참고" },
};

const CATEGORY_EMOJI: Record<string, string> = {
  "질문": "Q&A",
  "공지": "NOTICE",
  "투표": "VOTE",
  "일정": "EVENT",
};

export default function WeeklySummary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 주간 브리핑 팝업이 열리면 배경 스크롤 잠금
  useBodyScrollLock(open);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-weekly", { method: "POST" });
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "요약을 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && !data && !loading) {
      loadData();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold">주간 브리핑</h2>
                <p className="text-xs text-white/70">이번 주 커뮤니티 요약</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500">AI가 이번 주 데이터를 분석 중...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button onClick={loadData} className="text-sm text-indigo-600 font-medium hover:underline">
                다시 시도
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "질문", value: data.stats.questions, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "공지", value: data.stats.announcements, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "투표", value: data.stats.polls, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "일정", value: data.stats.events, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Most Active + Hot Topics */}
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 font-medium mb-1">가장 활발한 학교</p>
                  <p className="text-sm font-bold text-slate-800">{data.stats.most_active_school}</p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Flame size={12} className="text-orange-500" />
                    <p className="text-[10px] text-slate-400 font-medium">핫 토픽</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(data.stats.hot_topics || []).map((topic) => (
                      <span key={topic} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {data.highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-500" />
                    주요 항목 (우선순위순)
                  </h3>
                  <div className="space-y-2">
                    {data.highlights.map((h, i) => {
                      const config = PRIORITY_CONFIG[h.priority] || PRIORITY_CONFIG.low;
                      return (
                        <div key={i} className={`${config.bg} border ${config.border} rounded-xl p-3`}>
                          <div className="flex items-start gap-2.5">
                            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                              <div className={`w-2 h-2 ${config.color} rounded-full`} />
                              <span className={`text-[10px] font-bold ${config.text}`}>{config.label}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">
                                  {CATEGORY_EMOJI[h.category] || h.category}
                                </span>
                                <p className="text-sm font-bold text-slate-800 truncate">{h.title}</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{h.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    <Lightbulb size={16} className="text-indigo-500" />
                    추천
                  </h3>
                  <ul className="space-y-1.5">
                    {data.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-indigo-700">
                        <ChevronRight size={14} className="flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
