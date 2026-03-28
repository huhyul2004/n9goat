"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { getMyPosts, getMyComments, fetchMails, fetchProfileById } from "@/lib/db";
import type { Post, Comment, Mail, Profile } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { User, MessageSquare, MessageCircle, Inbox, SendHorizontal, ArrowLeft, Settings, Plus, Moon, Sun, ImageIcon, Pencil, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/store/useSettings";

type Tab = "posts" | "comments" | "inbox" | "sent" | "settings";

function ProfileContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUserId = searchParams.get("user_id");
  const isOwnProfile = !targetUserId || targetUserId === user?.id;
  const { showBackground, setShowBackground, darkMode, setDarkMode, avatar, setAvatar, init: initSettings } = useSettings();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [inbox, setInbox] = useState<Mail[]>([]);
  const [sent, setSent] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);

  const displayUser = isOwnProfile ? user : targetProfile;

  useEffect(() => { initSettings(); }, [initSettings]);

  // 자기소개 로드
  useEffect(() => {
    if (typeof window === "undefined") return;
    const uid = targetUserId || user?.id;
    if (uid) {
      const saved = localStorage.getItem(`n9_bio_${uid}`);
      setBio(saved || "");
    }
  }, [targetUserId, user?.id]);

  useEffect(() => {
    if (targetUserId && targetUserId !== user?.id) {
      fetchProfileById(targetUserId).then((p) => setTargetProfile(p as Profile | null));
    }
  }, [targetUserId, user?.id]);

  useEffect(() => { load(); }, [tab, targetUserId]);

  async function load() {
    const uid = targetUserId || user?.id;
    if (!uid) return;
    setLoading(true);
    if (tab === "posts") setPosts(await getMyPosts(uid));
    else if (tab === "comments") setComments(await getMyComments(uid));
    else if (tab === "inbox" && isOwnProfile && user) setInbox(await fetchMails(user.id, "inbox"));
    else if (tab === "sent" && isOwnProfile && user) setSent(await fetchMails(user.id, "sent"));
    setLoading(false);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("이미지는 2MB 이하만 가능합니다"); return; }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "방금 전"; if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`; return `${Math.floor(hr / 24)}일 전`;
  }

  const TABS: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
    { id: "posts", label: isOwnProfile ? "내 글" : "작성 글", icon: MessageSquare },
    { id: "comments", label: isOwnProfile ? "내 댓글" : "작성 댓글", icon: MessageCircle },
    ...(isOwnProfile ? [
      { id: "inbox" as Tab, label: "받은 메일", icon: Inbox },
      { id: "sent" as Tab, label: "보낸 메일", icon: SendHorizontal },
      { id: "settings" as Tab, label: "설정", icon: Settings },
    ] : []),
  ];

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-3 md:p-8">
          {!isOwnProfile && (
            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
              <ArrowLeft size={16} /> 뒤로가기
            </button>
          )}

          {/* Profile header */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
            <div className="h-20 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900" />
            <div className="px-6 pb-6 pt-5">
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar with upload button */}
                <div className="relative">
                  {avatar && isOwnProfile ? (
                    <img src={avatar} alt="avatar" className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg">
                      {displayUser?.name?.charAt(0) || <User size={24} />}
                    </div>
                  )}
                  {isOwnProfile && (
                    <>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors border-2 border-white"
                      >
                        <Plus size={12} />
                      </button>
                    </>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{displayUser?.name}</h2>
                  <p className="text-sm text-indigo-600 font-medium">{displayUser?.school} {displayUser?.role}</p>
                </div>
              </div>

              {/* 자기소개 */}
              <div className="mt-2">
                {editingBio && isOwnProfile ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setBio(bioInput);
                          localStorage.setItem(`n9_bio_${user?.id}`, bioInput);
                          setEditingBio(false);
                        }
                      }}
                      placeholder="자기소개를 입력하세요"
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      maxLength={100}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setBio(bioInput);
                        localStorage.setItem(`n9_bio_${user?.id}`, bioInput);
                        setEditingBio(false);
                      }}
                      className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${bio ? "text-slate-600" : "text-slate-400 italic"}`}>
                      {bio || (isOwnProfile ? "자기소개를 작성해보세요" : "자기소개가 없습니다")}
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={() => { setBioInput(bio); setEditingBio(true); }}
                        className="text-slate-400 hover:text-indigo-600 transition p-1"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 md:gap-2 mb-5 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${tab === t.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {tab === "settings" && isOwnProfile ? (
            <div className="space-y-3">
              {/* Profile picture */}
              <div className="bg-white p-5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon size={18} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">프로필 사진</p>
                      <p className="text-xs text-slate-400 mt-0.5">{avatar ? "사진이 설정되어 있습니다" : "기본 이니셜 사용 중"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => avatarInputRef.current?.click()} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition font-medium">
                      변경
                    </button>
                    {avatar && (
                      <button onClick={() => setAvatar(null)} className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium">
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dark mode */}
              <div className="bg-white p-5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-400" />}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">다크 모드</p>
                      <p className="text-xs text-slate-400 mt-0.5">어두운 테마로 전환합니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${darkMode ? "bg-indigo-600" : "bg-slate-300"}`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>

              {/* Background watermark */}
              <div className="bg-white p-5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">배경 워터마크</p>
                    <p className="text-xs text-slate-400 mt-0.5">&quot;남구 학교 커뮤니티&quot; 반투명 표시</p>
                  </div>
                  <button
                    onClick={() => setShowBackground(!showBackground)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${showBackground ? "bg-indigo-600" : "bg-slate-300"}`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${showBackground ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3">현재: 배경 {showBackground ? "O" : "X"}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {tab === "posts" && (posts.length === 0 ? <Empty text="작성한 글이 없습니다" /> : posts.map((p) => (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  {p.title !== "(제목 없음)" && <p className="text-sm font-semibold text-slate-800 mb-1">{p.title}</p>}
                  <p className="text-sm text-slate-600 line-clamp-2">{p.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{timeAgo(p.created_at)}</p>
                </div>
              )))}

              {tab === "comments" && (comments.length === 0 ? <Empty text="작성한 댓글이 없습니다" /> : comments.map((c) => (
                <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <p className="text-sm text-slate-600 line-clamp-3">{c.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{timeAgo(c.created_at)}</p>
                </div>
              )))}

              {tab === "inbox" && isOwnProfile && (inbox.length === 0 ? <Empty text="받은 메일이 없습니다" /> : inbox.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-sm ${m.is_read ? "text-slate-600" : "font-bold text-slate-800"}`}>{m.from_school} {m.from_role}</span>
                    <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString("ko-KR")}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{m.subject}</p>
                </div>
              )))}

              {tab === "sent" && isOwnProfile && (sent.length === 0 ? <Empty text="보낸 메일이 없습니다" /> : sent.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm text-slate-600">{m.to_school} {m.to_role}</span>
                    <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString("ko-KR")}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{m.subject}</p>
                </div>
              )))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-16 text-slate-400 text-sm">{text}</div>;
}

export default function ProfilePage() {
  return (<AuthGuard><ProfileContent /></AuthGuard>);
}
