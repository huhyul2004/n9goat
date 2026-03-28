"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchPosts as dbFetchPosts, createPost, updatePost, deletePost, togglePinPost,
  fetchComments, createComment, updateComment, deleteComment, getCommentCounts,
} from "@/lib/db";
import { ANNOUNCEMENT_ROLES, DELETE_ROLES, SCHOOLS, SCHOOL_LIST } from "@/lib/constants";
import type { Post, Comment } from "@/lib/types";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/store/useToast";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import ProfileTooltip from "@/components/ProfileTooltip";
import {
  Search, PenSquare, X, MessageCircle, Send, ChevronDown, ChevronUp,
  User, MoreVertical, Pencil, Trash2, Megaphone, Paperclip, Sparkles, Pin, EyeOff,
} from "lucide-react";

type SortMode = "latest" | "most_comments" | "mine";

function BoardContent() {
  const { user } = useAuth();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [loading, setLoading] = useState(true);

  // Write modal
  const [showWrite, setShowWrite] = useState(false);
  const [writeType, setWriteType] = useState<"question" | "announcement">("question");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAttachment, setNewAttachment] = useState<string | undefined>();
  const [newAttachmentName, setNewAttachmentName] = useState<string | undefined>();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit post
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Expanded post
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [menuOpenPost, setMenuOpenPost] = useState<string | null>(null);
  const [menuOpenComment, setMenuOpenComment] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState<{ ok: boolean; reason?: string; suggested_title?: string; suggested_content?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadPosts(); }, []);

  // URL 쿼리 파라미터로 게시글 자동 펼치기 (대시보드에서 클릭 시)
  useEffect(() => {
    const postId = searchParams.get("post");
    if (postId && !loading) {
      setExpandedId(postId);
      setTimeout(() => {
        document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [searchParams, loading]);

  async function loadPosts() {
    setLoading(true);
    const [questions, anns] = await Promise.all([
      dbFetchPosts("question"),
      dbFetchPosts("announcement"),
    ]);
    setPosts(questions);
    setAnnouncements(anns);
    const allIds = [...questions, ...anns].map((p) => p.id);
    if (allIds.length > 0) {
      const counts = await getCommentCounts(allIds);
      setCommentCounts(counts);
    }
    setLoading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.add("파일은 5MB 이하만 가능합니다", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setNewAttachment(reader.result as string);
      setNewAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function handleAiWrite() {
    const keywords = newContent.trim() || newTitle.trim();
    if (!keywords) {
      toast.add("키워드를 먼저 입력해주세요", "error");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords, type: writeType }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.title) setNewTitle(data.title);
        if (data.body) setNewContent(data.body);
        toast.add("AI가 글을 작성했습니다!", "success");
      } else {
        toast.add(data.error || "AI 작성에 실패했습니다", "error");
      }
    } catch {
      toast.add("네트워크 오류가 발생했습니다", "error");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    if (!user || !newContent.trim()) return;

    // AI 비윤리 검사
    setModerating(true);
    setModerationResult(null);
    try {
      const modRes = await fetch("/api/ai-moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }),
      });
      const modData = await modRes.json();
      if (!modData.ok) {
        setModerationResult(modData);
        setModerating(false);
        return;
      }
    } catch {
      // 검사 실패 시 그냥 통과
    }
    setModerating(false);

    setSubmitting(true);
    const result = await createPost({
      category: writeType,
      title: newTitle.trim() || "(제목 없음)",
      content: newContent.trim(),
      author_school: user.school,
      author_role: user.role,
      author_id: user.id,
      attachment: newAttachment,
      attachment_name: newAttachmentName,
      is_anonymous: isAnonymous,
    });
    if (result.ok) {
      setNewTitle(""); setNewContent(""); setNewAttachment(undefined); setNewAttachmentName(undefined);
      setIsAnonymous(false); setModerationResult(null);
      setShowWrite(false);
      toast.add(writeType === "announcement" ? "공지가 등록되었습니다" : "글이 게시되었습니다", "success");
      loadPosts();
    } else {
      console.error("[handleSubmit] 게시 실패:", result.error);
      toast.add(`게시에 실패했습니다: ${result.error || "알 수 없는 오류"}`, "error");
    }
    setSubmitting(false);
  }

  async function handleUpdatePost() {
    if (!editingPost) return;
    const ok = await updatePost(editingPost.id, { title: editTitle, content: editContent });
    if (ok) { setEditingPost(null); toast.add("수정되었습니다", "success"); loadPosts(); }
  }

  async function handleDeletePost(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const ok = await deletePost(id);
    if (ok) { toast.add("삭제되었습니다", "success"); loadPosts(); if (expandedId === id) setExpandedId(null); }
  }

  async function handleTogglePin(id: string, currentPinned: boolean) {
    await togglePinPost(id, !currentPinned);
    toast.add(currentPinned ? "고정 해제되었습니다" : "상단에 고정되었습니다", "success");
    loadPosts();
  }

  async function toggleExpand(postId: string) {
    if (expandedId === postId) { setExpandedId(null); return; }
    setExpandedId(postId);
    setCommentsLoading(true);
    setComments(await fetchComments(postId));
    setCommentsLoading(false);
  }

  async function handleCommentSubmit(postId: string) {
    if (!user || !newComment.trim()) return;
    setCommentSubmitting(true);
    await createComment({ post_id: postId, content: newComment.trim(), author_school: user.school, author_role: user.role, author_id: user.id });
    setNewComment("");
    const data = await fetchComments(postId);
    setComments(data);
    setCommentCounts((prev) => ({ ...prev, [postId]: data.length }));
    setCommentSubmitting(false);
  }

  async function handleUpdateComment(id: string) {
    await updateComment(id, editCommentContent);
    setEditingComment(null);
    if (expandedId) setComments(await fetchComments(expandedId));
  }

  async function handleDeleteComment(id: string) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await deleteComment(id);
    if (expandedId) {
      const data = await fetchComments(expandedId);
      setComments(data);
      setCommentCounts((prev) => ({ ...prev, [expandedId]: data.length }));
    }
  }

  const canAnnounce = user && ANNOUNCEMENT_ROLES.includes(user.role);

  // Apply search
  let filtered = posts.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.author_school.includes(search)
  );

  // Pinned posts first, then apply sort
  const pinned = filtered.filter((p) => p.pinned);
  const unpinned = filtered.filter((p) => !p.pinned);

  if (sortMode === "most_comments") {
    const sorted = [...unpinned].sort((a, b) => {
      const diff = (commentCounts[b.id] || 0) - (commentCounts[a.id] || 0);
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    filtered = [...pinned, ...sorted];
  } else if (sortMode === "mine" && user) {
    filtered = filtered.filter((p) => p.author_id === user.id);
  } else {
    filtered = [...pinned, ...unpinned];
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return "방금 전";
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    return `${Math.floor(hr / 24)}일 전`;
  }

  function renderPost(post: Post, isAnnouncement = false) {
    const isExpanded = expandedId === post.id;
    const count = commentCounts[post.id] || 0;
    const isOwner = user?.id === post.author_id;
    const isSuper = user && DELETE_ROLES.includes(user.role);
    const canDelete = isOwner || isSuper;
    const canEdit = isOwner || isSuper;
    const showMenu = canDelete || canEdit;

    return (
      <div key={post.id} id={`post-${post.id}`} className={`bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md ${isAnnouncement ? "border-2 border-amber-300/60 shadow-amber-100/50" : "border border-slate-100 shadow-sm"}`}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {post.is_anonymous ? (
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold flex-shrink-0">
                <EyeOff size={22} />
              </div>
            ) : (
              <ProfileTooltip authorSchool={post.author_school} authorRole={post.author_role} authorId={post.author_id} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {post.pinned && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      <Pin size={10} /> 고정
                    </span>
                  )}
                  {isAnnouncement && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Megaphone size={12} /> 공지
                    </span>
                  )}
                  <h3 className="font-bold text-slate-800 truncate">
                    {post.is_anonymous ? (
                      <span className="text-slate-500">익명</span>
                    ) : (
                      <>{post.author_school} <span className="text-indigo-600">{post.author_role}</span></>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
                  {post.updated_at && <span className="text-xs text-slate-400">(수정됨)</span>}
                  {showMenu && (
                    <div className="relative">
                      <button onClick={() => setMenuOpenPost(menuOpenPost === post.id ? null : post.id)} className="p-1 text-slate-400 hover:text-slate-600"><MoreVertical size={14} /></button>
                      {menuOpenPost === post.id && (
                        <div className="absolute right-0 top-7 bg-white border border-slate-200 shadow-lg rounded-lg py-1 z-20 w-28">
                          {canEdit && (
                            <button onClick={() => { setEditingPost(post); setEditTitle(post.title); setEditContent(post.content); setMenuOpenPost(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"><Pencil size={12} /> 수정</button>
                          )}
                          {canDelete && (
                            <button onClick={() => { handleTogglePin(post.id, !!post.pinned); setMenuOpenPost(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50"><Pin size={12} /> {post.pinned ? "고정 해제" : "고정"}</button>
                          )}
                          {canDelete && (
                            <button onClick={() => { handleDeletePost(post.id); setMenuOpenPost(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"><Trash2 size={12} /> 삭제</button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {post.title && post.title !== "(제목 없음)" && <p className="text-sm font-semibold text-slate-700 mb-1">{post.title}</p>}
              <p className="text-slate-600 leading-relaxed break-words whitespace-pre-wrap">{post.content}</p>
              {post.attachment_name && (
                <a href={post.attachment} download={post.attachment_name} className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg">
                  <Paperclip size={12} /> {post.attachment_name}
                </a>
              )}
            </div>
          </div>
          <button onClick={() => toggleExpand(post.id)} className="mt-3 ml-16 flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
            <MessageCircle size={14} />
            <span>댓글 {count > 0 ? count : ""}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50/50">
            {commentsLoading ? (
              <div className="flex justify-center py-6"><div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                {comments.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {comments.map((c) => {
                      const cOwner = user?.id === c.author_id;
                      return (
                        <div key={c.id} className="px-5 py-4">
                          {editingComment === c.id ? (
                            <div className="ml-11">
                              <textarea value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} rows={3} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y leading-relaxed" />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => handleUpdateComment(c.id)} className="text-xs bg-slate-900 text-white px-3 py-1 rounded-lg">저장</button>
                                <button onClick={() => setEditingComment(null)} className="text-xs text-slate-500 px-3 py-1">취소</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5"><User size={16} /></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-sm font-semibold text-slate-700">{c.author_school} <span className="text-indigo-500 font-medium">{c.author_role}</span></span>
                                  <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                                  {c.updated_at && <span className="text-xs text-slate-400">(수정됨)</span>}
                                  {cOwner && (
                                    <div className="relative ml-auto">
                                      <button onClick={() => setMenuOpenComment(menuOpenComment === c.id ? null : c.id)} className="p-0.5 text-slate-400 hover:text-slate-600"><MoreVertical size={12} /></button>
                                      {menuOpenComment === c.id && (
                                        <div className="absolute right-0 top-5 bg-white border border-slate-200 shadow-lg rounded-lg py-1 z-20 w-20">
                                          <button onClick={() => { setEditingComment(c.id); setEditCommentContent(c.content); setMenuOpenComment(null); }} className="w-full flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"><Pencil size={10} /> 수정</button>
                                          <button onClick={() => { handleDeleteComment(c.id); setMenuOpenComment(null); }} className="w-full flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"><Trash2 size={10} /> 삭제</button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center text-xs text-slate-400">아직 댓글이 없습니다.</div>
                )}
                <div className="px-5 py-4 border-t border-slate-100">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 text-xs font-bold">
                      {user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글을 입력하세요..." rows={3} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y leading-relaxed" />
                      <div className="flex justify-end mt-2">
                        <button onClick={() => handleCommentSubmit(post.id)} disabled={commentSubmitting || !newComment.trim()} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                          <Send size={12} /> {commentSubmitting ? "작성 중..." : "댓글 달기"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-3 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Question</h2>
              <p className="text-sm text-slate-500 mt-0.5">궁금한 것을 물어보세요</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="검색" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm" />
              </div>
              <button onClick={() => { setWriteType("question"); setShowWrite(true); }} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                <PenSquare size={16} /> 작성
              </button>
            </div>
          </div>

          {/* Sort/Filter + Announcement button */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {([["latest", "최신순"], ["most_comments", "댓글순"], ["mine", "내 글"]] as [SortMode, string][]).map(([mode, label]) => (
                <button key={mode} onClick={() => setSortMode(mode)} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${sortMode === mode ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  {label}
                </button>
              ))}
            </div>
            {canAnnounce && (
              <button onClick={() => { setWriteType("announcement"); setShowWrite(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-medium hover:bg-amber-200 transition-colors">
                <Megaphone size={14} /> 공지 작성
              </button>
            )}
          </div>

          {/* Write Modal */}
          {showWrite && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    {writeType === "announcement" && <Megaphone size={18} className="text-amber-500" />}
                    {writeType === "announcement" ? "공지사항 작성" : "새 질문 작성"}
                  </h3>
                  <button onClick={() => setShowWrite(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="mb-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                    <Sparkles size={13} /> AI 글쓰기 도우미
                  </p>
                  <p className="text-xs text-indigo-500 mt-1">
                    키워드만 입력하고 아래 <span className="font-bold">✨ AI 작성</span> 버튼을 누르면 AI가 글을 완성해줍니다!
                    <br />예: &quot;체육대회 날짜 변경 안내&quot; → AI가 제목과 본문을 자동 작성
                  </p>
                </div>
                <input type="text" placeholder="제목 (선택)" value={newTitle} onChange={(e) => { setNewTitle(e.target.value); setModerationResult(null); }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm mb-3" />
                <textarea placeholder="키워드를 입력하고 AI 작성 버튼을 눌러보세요..." value={newContent} onChange={(e) => { setNewContent(e.target.value); setModerationResult(null); }} rows={6} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm resize-y leading-relaxed" />
                {/* AI 비윤리 검사 결과 */}
                {moderationResult && !moderationResult.ok && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-700 mb-1">AI 검수 결과: 수정이 필요합니다</p>
                    <p className="text-xs text-red-600 mb-2">{moderationResult.reason}</p>
                    {moderationResult.suggested_content && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">AI 수정 제안:</p>
                        {moderationResult.suggested_title && moderationResult.suggested_title !== newTitle && (
                          <div className="mb-1">
                            <span className="text-[10px] text-slate-400">제목:</span>
                            <p className="text-xs text-slate-700 bg-white border border-red-100 rounded-lg p-2">{moderationResult.suggested_title}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-slate-400">본문:</span>
                          <p className="text-xs text-slate-700 bg-white border border-red-100 rounded-lg p-2 whitespace-pre-wrap">{moderationResult.suggested_content}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (moderationResult.suggested_title) setNewTitle(moderationResult.suggested_title);
                            if (moderationResult.suggested_content) setNewContent(moderationResult.suggested_content);
                            setModerationResult(null);
                          }}
                          className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors"
                        >
                          제안 반영하기
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.hwp,.xlsx" />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition">
                      <Paperclip size={14} /> 첨부
                    </button>
                    <button onClick={handleAiWrite} disabled={aiLoading} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50">
                      <Sparkles size={14} className={aiLoading ? "animate-spin" : ""} /> {aiLoading ? "AI 작성 중..." : "AI 작성"}
                    </button>
                    <button onClick={() => setIsAnonymous(!isAnonymous)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ${isAnonymous ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                      <EyeOff size={14} /> 익명
                    </button>
                    {newAttachmentName && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{newAttachmentName}</span>}
                  </div>
                  <button onClick={handleSubmit} disabled={submitting || moderating || !newContent.trim()} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                    {moderating ? "AI 검수 중..." : submitting ? "작성 중..." : "게시하기"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Post Modal */}
          {editingPost && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">글 수정</h3>
                  <button onClick={() => setEditingPost(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm mb-3" />
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-sm resize-y leading-relaxed" />
                <div className="flex justify-end mt-4">
                  <button onClick={handleUpdatePost} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors">저장</button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              {/* Announcements pinned */}
              {announcements.length > 0 && (
                <div className="space-y-3 mb-6">
                  {(sortMode === "mine" && user
                    ? announcements.filter((a) => a.author_id === user.id)
                    : announcements
                  ).map((a) => renderPost(a, true))}
                </div>
              )}

              {/* Posts */}
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  {search ? (
                    <p className="text-slate-400 text-sm">검색 결과가 없습니다.</p>
                  ) : sortMode === "mine" ? (
                    <p className="text-slate-400 text-sm">아직 작성한 글이 없습니다.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                        <Sparkles size={28} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">아직 게시글이 없습니다</p>
                        <p className="text-slate-400 text-sm mt-1">첫 번째 질문을 올려보세요!</p>
                      </div>
                      <button
                        onClick={() => { setWriteType("question"); setShowWrite(true); }}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                        <PenSquare size={16} /> 첫 글 작성하기
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">{filtered.map((post) => renderPost(post))}</div>
              )}

              {/* Footer area - schools info */}
              {filtered.length > 0 && (
                <div className="mt-10 bg-white rounded-2xl border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">참여 학교</h3>
                  <div className="flex flex-wrap gap-2">
                    {SCHOOL_LIST.map((s) => (
                      <span key={s} className="text-xs bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function BoardPage() {
  return (
    <AuthGuard>
      <BoardContent />
    </AuthGuard>
  );
}
