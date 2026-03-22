"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchMails as dbFetchMails, markMailRead, createMail, deleteMail } from "@/lib/db";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/store/useToast";
import type { Mail } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import {
  Mail as MailIcon, ChevronRight, Clock, ArrowLeft,
  Inbox, SendHorizontal, PenSquare, Reply, Paperclip, Trash2,
} from "lucide-react";

function MailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [mails, setMails] = useState<Mail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Mail | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<string | undefined>();
  const [replyAttachmentName, setReplyAttachmentName] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadMails(); }, [tab]);

  async function loadMails() {
    if (!user) return;
    setLoading(true);
    setSelected(null);
    setShowReply(false);
    const data = await dbFetchMails(user.id, tab);
    setMails(data);
    setLoading(false);
  }

  async function openMail(mail: Mail) {
    if (!mail.is_read && tab === "inbox") await markMailRead(mail.id);
    setSelected({ ...mail, is_read: true });
    setShowReply(false);
  }

  function startReply() {
    if (!selected) return;
    setReplySubject(`RE: ${selected.subject}`);
    setReplyBody("");
    setReplyAttachment(undefined);
    setReplyAttachmentName(undefined);
    setShowReply(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.add("파일은 5MB 이하만 가능합니다", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => { setReplyAttachment(reader.result as string); setReplyAttachmentName(file.name); };
    reader.readAsDataURL(file);
  }

  async function handleDeleteMail() {
    if (!selected) return;
    if (!confirm("이 메일을 삭제하시겠습니까?")) return;
    await deleteMail(selected.id);
    setSelected(null);
    loadMails();
  }

  async function handleSendReply() {
    if (!user || !selected || !replyBody.trim()) return;
    setSending(true);
    const ok = await createMail({
      from_id: user.id,
      from_school: user.school,
      from_role: user.role,
      to_id: selected.from_id,
      to_school: selected.from_school,
      to_role: selected.from_role,
      subject: replySubject || "(제목 없음)",
      body: replyBody.trim(),
      attachment: replyAttachment,
      attachment_name: replyAttachmentName,
    });
    if (ok) {
      toast.add("답장을 보냈습니다", "success");
      setShowReply(false);
      setReplyBody("");
    }
    setSending(false);
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto p-3 md:p-8">
          {selected ? (
            <div>
              <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4 md:mb-6 transition-colors p-1">
                <ArrowLeft size={20} /> 뒤로가기
              </button>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><MailIcon size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {tab === "inbox" ? `${selected.from_school} ${selected.from_role}` : `${selected.to_school} ${selected.to_role}`}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(selected.created_at).toLocaleString("ko-KR")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tab === "inbox" && (
                      <button onClick={startReply} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-2 rounded-lg transition">
                        <Reply size={14} /> 답장
                      </button>
                    )}
                    <button onClick={handleDeleteMail} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg transition">
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                </div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 mb-3">{selected.subject}</h2>
                <p className="text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{selected.body}</p>
                {selected.attachment_name && (
                  <a href={selected.attachment} download={selected.attachment_name} className="inline-flex items-center gap-1 mt-3 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    <Paperclip size={12} /> {selected.attachment_name}
                  </a>
                )}
              </div>

              {showReply && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 mt-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1"><Reply size={14} /> 답장</h3>
                  <input type="text" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} className="w-full p-3 border-b border-slate-100 outline-none text-sm mb-3" />
                  <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="답장 내용..." rows={5} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y leading-relaxed" />
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 shrink-0"><Paperclip size={14} /> 첨부</button>
                      {replyAttachmentName && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded truncate">{replyAttachmentName}</span>}
                    </div>
                    <button onClick={handleSendReply} disabled={sending || !replyBody.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:bg-slate-300 shrink-0">
                      {sending ? "전송 중..." : "보내기"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
                <div className="flex gap-1.5">
                  <button onClick={() => setTab("inbox")} className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "inbox" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                    <Inbox size={15} /> <span className="hidden sm:inline">받은 </span>메일
                  </button>
                  <button onClick={() => setTab("sent")} className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition ${tab === "sent" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                    <SendHorizontal size={15} /> <span className="hidden sm:inline">보낸 </span>메일
                  </button>
                </div>
                <button onClick={() => router.push("/mail/compose")} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0">
                  <PenSquare size={14} /> <span className="hidden sm:inline">새 </span>메일
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : mails.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">{tab === "inbox" ? "받은 메일이 없습니다." : "보낸 메일이 없습니다."}</div>
              ) : (
                <div className="space-y-2">
                  {mails.map((mail) => (
                    <button key={mail.id} onClick={() => openMail(mail)} className="w-full text-left bg-white p-3.5 md:p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${tab === "inbox" && !mail.is_read ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                        <MailIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5 gap-2">
                          <h3 className={`text-sm truncate ${tab === "inbox" && !mail.is_read ? "font-bold text-slate-800" : "text-slate-600"}`}>
                            {tab === "inbox" ? `${mail.from_school.replace("중학교", "중")} ${mail.from_role}` : `${mail.to_school.replace("중학교", "중")} ${mail.to_role}`}
                          </h3>
                          <span className="text-[11px] text-slate-400 shrink-0">{new Date(mail.created_at).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <p className="text-slate-500 text-sm truncate">{mail.subject}</p>
                      </div>
                      <ChevronRight className="text-slate-300 shrink-0 hidden sm:block" size={18} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MailPage() {
  return (<AuthGuard><MailContent /></AuthGuard>);
}
