"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/store/useAuth";
import { fetchChatMessages, sendChatMessage } from "@/lib/db";
import { SCHOOLS } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Send, User, Hash, Paperclip, X, Image as ImageIcon } from "lucide-react";

const ROOMS = ["전체", ...SCHOOLS];

function ChatContent() {
  const { user } = useAuth();
  const [room, setRoom] = useState("전체");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<string | undefined>();
  const [attachmentName, setAttachmentName] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadMessages(); }, [room]);

  useEffect(() => {
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [room]);

  async function loadMessages() {
    const data = await fetchChatMessages(room);
    setMessages(data);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("5MB 이하만 가능합니다"); return; }
    const reader = new FileReader();
    reader.onload = () => { setAttachment(reader.result as string); setAttachmentName(file.name); };
    reader.readAsDataURL(file);
  }

  async function handleSend() {
    if (!user || (!input.trim() && !attachment)) return;
    setSending(true);
    await sendChatMessage({
      room,
      content: input.trim(),
      author_school: user.school,
      author_role: user.role,
      author_id: user.id,
      attachment,
      attachment_name: attachmentName,
    });
    setInput("");
    setAttachment(undefined);
    setAttachmentName(undefined);
    await loadMessages();
    setSending(false);
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 flex flex-col pb-14 md:pb-0 min-w-0 overflow-hidden">
        {/* Room selector */}
        <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-hide">
          {ROOMS.map((r) => (
            <button key={r} onClick={() => setRoom(r)} className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${room === r ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              <Hash size={11} /> {r.replace("중학교", "중")}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-20 text-slate-400 text-sm">아직 메시지가 없습니다. 첫 메시지를 보내보세요!</div>
          )}
          {messages.map((msg) => {
            const isMe = user?.id === msg.author_id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 mt-1"><User size={14} /></div>
                )}
                <div className={`max-w-[80%] sm:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <p className="text-[11px] text-slate-500 mb-0.5 px-1">{msg.author_school.replace("중학교", "중")} <span className="text-indigo-500">{msg.author_role}</span></p>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${isMe ? "bg-indigo-600 text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"}`}>
                    {msg.attachment && msg.attachment.startsWith("data:image") && (
                      <img src={msg.attachment} alt="" className="max-w-full rounded-lg mb-1.5 max-h-48 object-contain" />
                    )}
                    {msg.attachment && !msg.attachment.startsWith("data:image") && (
                      <a href={msg.attachment} download={msg.attachment_name} className={`flex items-center gap-1 text-xs mb-1.5 ${isMe ? "text-indigo-200" : "text-indigo-600"}`}>
                        <Paperclip size={12} /> {msg.attachment_name}
                      </a>
                    )}
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-slate-400 mt-0.5 px-1 ${isMe ? "text-right" : ""}`}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 p-2.5 md:p-3 shrink-0">
          {attachmentName && (
            <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
              <Paperclip size={12} /> {attachmentName}
              <button onClick={() => { setAttachment(undefined); setAttachmentName(undefined); }} className="ml-auto text-slate-400 hover:text-red-500"><X size={14} /></button>
            </div>
          )}
          <div className="max-w-3xl mx-auto flex gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.hwp" />
            <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition shrink-0">
              <Paperclip size={16} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); } }}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button onClick={handleSend} disabled={sending || (!input.trim() && !attachment)} className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition disabled:bg-slate-300 shrink-0">
              <Send size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (<AuthGuard><ChatContent /></AuthGuard>);
}
