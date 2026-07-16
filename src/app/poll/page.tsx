"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/store/useToast";
import { fetchPolls, createPoll, votePoll, cancelVote, deletePoll, addPollOption } from "@/lib/db";
import type { Poll } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { BarChart3, Plus, X, Check, Trash2, PenLine } from "lucide-react";

function PollContent() {
  const { user } = useAuth();
  const toast = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  // 투표 생성 모달 열리면 배경 스크롤 잠금
  useBodyScrollLock(showCreate);
  const [newTitle, setNewTitle] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [allowOther, setAllowOther] = useState(false);
  // 기타 입력 상태: pollId -> 입력값
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});
  const [otherOpen, setOtherOpen] = useState<Record<string, boolean>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setPolls(await fetchPolls());
    setLoading(false);
  }

  async function handleCreate() {
    if (!user || !newTitle.trim()) return;
    const opts = newOptions.filter((o) => o.trim());
    if (opts.length < 2) { toast.add("선택지를 2개 이상 입력하세요", "error"); return; }
    // 기타 허용 시 "기타+" 선택지 자동 추가
    const finalOpts = allowOther ? [...opts, "기타+"] : opts;
    await createPoll({
      title: newTitle.trim(),
      options: finalOpts,
      allow_other: allowOther,
      author_school: user.school,
      author_role: user.role,
      author_id: user.id,
    });
    setNewTitle(""); setNewOptions(["", ""]); setAllowOther(false); setShowCreate(false);
    toast.add("투표가 생성되었습니다", "success");
    load();
  }

  async function handleVote(pollId: string, option: string) {
    if (!user) return;
    const poll = polls.find((p) => p.id === pollId);
    const myVote = poll?.votes[user.id];

    if (myVote === option) {
      setPolls((prev) =>
        prev.map((p) => {
          if (p.id !== pollId) return p;
          const newVotes = { ...p.votes };
          delete newVotes[user.id];
          return { ...p, votes: newVotes };
        })
      );
      await cancelVote(pollId, user.id);
      return;
    }

    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const newVotes = { ...p.votes, [user.id]: option };
        return { ...p, votes: newVotes };
      })
    );
    await votePoll(pollId, user.id, option);
  }

  async function handleOtherSubmit(pollId: string) {
    if (!user) return;
    const text = otherInputs[pollId]?.trim();
    if (!text) return;

    // 로컬 상태에 옵션 추가 + 투표
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        const newOptions = p.options.includes(text) ? p.options : [...p.options, text];
        const newVotes = { ...p.votes, [user.id]: text };
        return { ...p, options: newOptions, votes: newVotes };
      })
    );
    setOtherInputs((prev) => ({ ...prev, [pollId]: "" }));
    setOtherOpen((prev) => ({ ...prev, [pollId]: false }));

    // 서버에 옵션 추가 후 투표
    const poll = polls.find((p) => p.id === pollId);
    if (poll && !poll.options.includes(text)) {
      await addPollOption(pollId, text);
    }
    await votePoll(pollId, user.id, text);
  }

  async function handleDeletePoll(pollId: string) {
    if (!confirm("이 투표를 삭제하시겠습니까?")) return;
    await deletePoll(pollId);
    load();
  }

  function addOption() {
    setNewOptions([...newOptions, ""]);
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "방금 전"; if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`; return `${Math.floor(hr / 24)}일 전`;
  }

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-3 md:p-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="text-indigo-600" size={22} /> Poll</h2>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-colors">
              <Plus size={16} /> 만들기
            </button>
          </div>

          {/* Create modal */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">새 투표</h3>
                  <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <input type="text" placeholder="투표 제목 (예: 회의 일정 투표)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="space-y-2 mb-3">
                  {newOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" placeholder={`선택지 ${i + 1}`} value={opt} onChange={(e) => { const o = [...newOptions]; o[i] = e.target.value; setNewOptions(o); }} className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      {newOptions.length > 2 && (
                        <button onClick={() => setNewOptions(newOptions.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={addOption} className="text-xs text-indigo-600 hover:text-indigo-800">+ 선택지 추가</button>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setAllowOther(!allowOther)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${allowOther ? "bg-indigo-600" : "bg-slate-300"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${allowOther ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">기타 항목 허용</span>
                  </label>
                </div>
                <div className="flex justify-end">
                  <button onClick={handleCreate} disabled={!newTitle.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:bg-slate-300">만들기</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : polls.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">아직 투표가 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => {
                const totalVotes = Object.keys(poll.votes).length;
                const myVote = user ? poll.votes[user.id] : undefined;
                const hasVoted = !!myVote;

                const optionVotes: Record<string, number> = {};
                poll.options.forEach((o) => (optionVotes[o] = 0));
                Object.values(poll.votes).forEach((v) => { if (optionVotes[v] !== undefined) optionVotes[v]++; });

                return (
                  <div key={poll.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800">{poll.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {poll.author_school} {poll.author_role} · {timeAgo(poll.created_at)} · {totalVotes}명 참여
                          {poll.allow_other && <span className="ml-1.5 text-indigo-400">· 기타 허용</span>}
                        </p>
                      </div>
                      {user?.id === poll.author_id && (
                        <button onClick={() => handleDeletePoll(poll.id)} className="text-slate-300 hover:text-red-500 transition p-1"><Trash2 size={16} /></button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {poll.options.map((opt) => {
                        const isOtherBtn = opt === "기타+";
                        const count = optionVotes[opt] || 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isMyVote = myVote === opt;

                        // "기타+" 버튼: 클릭 시 입력창 오픈
                        if (isOtherBtn && !hasVoted) {
                          return otherOpen[poll.id] ? (
                            <div key={opt} className="flex gap-2">
                              <input
                                type="text"
                                placeholder="직접 입력하세요"
                                value={otherInputs[poll.id] || ""}
                                onChange={(e) => setOtherInputs((prev) => ({ ...prev, [poll.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") handleOtherSubmit(poll.id); }}
                                className="flex-1 p-2.5 bg-slate-50 border border-indigo-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleOtherSubmit(poll.id)}
                                disabled={!otherInputs[poll.id]?.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl text-sm font-medium disabled:bg-slate-300 transition"
                              >
                                추가
                              </button>
                              <button
                                onClick={() => setOtherOpen((prev) => ({ ...prev, [poll.id]: false }))}
                                className="text-slate-400 hover:text-slate-600 px-1"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              key={opt}
                              onClick={() => setOtherOpen((prev) => ({ ...prev, [poll.id]: true }))}
                              className="w-full rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition text-left"
                            >
                              <div className="flex items-center gap-2 px-4 py-2.5">
                                <PenLine size={14} className="text-slate-400" />
                                <span className="text-sm text-slate-400">기타+ (직접 입력)</span>
                              </div>
                            </button>
                          );
                        }

                        // "기타+" 버튼은 투표 후엔 숨김 (0표면)
                        if (isOtherBtn && hasVoted && count === 0) return null;

                        return (
                          <button
                            key={opt}
                            onClick={() => handleVote(poll.id, opt)}
                            className={`w-full relative overflow-hidden rounded-xl border transition text-left ${
                              isMyVote ? "border-indigo-400 bg-indigo-50" : hasVoted ? "border-slate-200 bg-slate-50 hover:border-indigo-300" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                            }`}
                          >
                            <div
                              className="absolute inset-y-0 left-0 bg-indigo-100/50 transition-all duration-500 ease-out"
                              style={{ width: hasVoted ? `${pct}%` : "0%" }}
                            />
                            <div className="relative flex items-center justify-between px-4 py-2.5">
                              <span className={`text-sm ${isMyVote ? "font-bold text-indigo-700" : "text-slate-700"}`}>
                                {isMyVote && <Check size={14} className="inline mr-1" />}{opt}
                              </span>
                              {hasVoted && <span className="text-xs text-slate-500 font-medium">{pct}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PollPage() {
  return (<AuthGuard><PollContent /></AuthGuard>);
}
