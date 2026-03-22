"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/store/useAuth";
import {
  fetchChatMessages, sendChatMessage, deleteChatMessage,
  fetchChatRooms, createChatRoom, updateChatRoomMembers, deleteChatRoom,
} from "@/lib/db";
import { SCHOOLS, ROLES } from "@/lib/constants";
import type { School, Role } from "@/lib/constants";
import type { ChatMessage, ChatRoom } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import {
  Send, User, Hash, Paperclip, X, Trash2,
  ChevronLeft, ChevronRight, Plus, Users, LogOut, UserPlus, UserMinus, Settings,
} from "lucide-react";

const SCHOOL_ROOMS = ["전체", ...SCHOOLS];

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
  const sendingRef = useRef(false);
  const roomScrollRef = useRef<HTMLDivElement>(null);

  // 단톡방 상태
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMembers, setInviteMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // 현재 단톡방 정보
  const currentGroupRoom = chatRooms.find((r) => `group_${r.id}` === room);
  const isGroupRoom = room.startsWith("group_");
  const isRoomOwner = currentGroupRoom?.owner_id === user?.id;

  useEffect(() => { loadMessages(); }, [room]);
  useEffect(() => { if (user) loadRooms(); }, [user]);

  useEffect(() => {
    const interval = setInterval(() => { loadMessages(); if (user) loadRooms(); }, 3000);
    return () => clearInterval(interval);
  }, [room, user]);

  async function loadMessages() {
    const data = await fetchChatMessages(room);
    setMessages(data);
  }

  async function loadRooms() {
    if (!user) return;
    setChatRooms(await fetchChatRooms(user.id));
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
    if (!user || (!input.trim() && !attachment) || sendingRef.current) return;
    sendingRef.current = true;
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
    sendingRef.current = false;
  }

  async function handleDeleteMessage(id: string) {
    if (!confirm("메시지를 삭제하시겠습니까?")) return;
    await deleteChatMessage(id);
    await loadMessages();
  }

  // 단톡방 만들기
  async function handleCreateRoom() {
    if (!user || !newRoomName.trim() || selectedMembers.length === 0) return;
    const members = [user.id, ...selectedMembers];
    await createChatRoom({ name: newRoomName.trim(), owner_id: user.id, members });
    setNewRoomName("");
    setSelectedMembers([]);
    setShowCreateRoom(false);
    await loadRooms();
  }

  // 멤버 선택 토글
  function toggleMember(memberId: string, list: string[], setList: (v: string[]) => void) {
    if (list.includes(memberId)) {
      setList(list.filter((m) => m !== memberId));
    } else {
      setList([...list, memberId]);
    }
  }

  // 멤버 내보내기 (방장만)
  async function handleKickMember(memberId: string) {
    if (!currentGroupRoom || !isRoomOwner) return;
    if (!confirm("이 멤버를 내보내시겠습니까?")) return;
    const newMembers = currentGroupRoom.members.filter((m) => m !== memberId);
    await updateChatRoomMembers(currentGroupRoom.id, newMembers);
    await loadRooms();
  }

  // 나가기
  async function handleLeaveRoom() {
    if (!currentGroupRoom || !user) return;
    if (!confirm("정말 이 단톡방을 나가시겠습니까? 나가면 대화 내용을 볼 수 없습니다.")) return;
    if (isRoomOwner) {
      if (!confirm("방장이 나가면 단톡방이 삭제됩니다. 계속하시겠습니까?")) return;
      await deleteChatRoom(currentGroupRoom.id);
    } else {
      const newMembers = currentGroupRoom.members.filter((m) => m !== user.id);
      await updateChatRoomMembers(currentGroupRoom.id, newMembers);
    }
    setRoom("전체");
    setShowRoomSettings(false);
    await loadRooms();
  }

  // 초대하기
  async function handleInviteMembers() {
    if (!currentGroupRoom || inviteMembers.length === 0) return;
    const newMembers = [...new Set([...currentGroupRoom.members, ...inviteMembers])];
    await updateChatRoomMembers(currentGroupRoom.id, newMembers);
    setInviteMembers([]);
    setShowInviteModal(false);
    await loadRooms();
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  // 전체 멤버 목록 생성 (한번만)
  const allMembers = SCHOOLS.flatMap((school) =>
    ROLES.map((role) => ({ id: `${school}_${role}`, school, role }))
  ).filter((m) => m.id !== user?.id);

  function renderMemberList(selected: string[], onToggle: (id: string) => void, excludeIds?: string[]) {
    const filtered = allMembers.filter((m) => {
      if (excludeIds?.includes(m.id)) return false;
      if (!memberSearch.trim()) return true;
      const q = memberSearch.trim().toLowerCase();
      return m.school.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
    });
    return filtered.map((m) => {
      const isSelected = selected.includes(m.id);
      return (
        <button
          key={m.id}
          onClick={() => onToggle(m.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
            isSelected ? "bg-indigo-100 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
          }`}
        >
          <span>{m.school.replace("중학교", "중")} {m.role}</span>
          {isSelected && <span className="text-indigo-600 font-bold">V</span>}
        </button>
      );
    });
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 flex flex-col pb-14 md:pb-0 min-w-0 overflow-hidden">
        {/* Room selector */}
        <div className="bg-white border-b border-slate-200 flex items-center shrink-0 relative">
          <button
            onClick={() => { const el = roomScrollRef.current; if (el) el.scrollBy({ left: -150, behavior: "smooth" }); }}
            className="absolute left-0 z-10 w-8 h-full bg-gradient-to-r from-white via-white/90 to-transparent flex items-center justify-center text-slate-500 hover:text-indigo-600 shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div
            ref={roomScrollRef}
            className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide py-2.5 px-9"
          >
            {/* 학교 톡방 */}
            {SCHOOL_ROOMS.map((r) => (
              <button key={r} onClick={() => { setRoom(r); setShowRoomSettings(false); }} className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${room === r ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                <Hash size={11} /> {r.replace("중학교", "중")}
              </button>
            ))}
          </div>
          <button
            onClick={() => { const el = roomScrollRef.current; if (el) el.scrollBy({ left: 150, behavior: "smooth" }); }}
            className="absolute right-0 z-10 w-8 h-full bg-gradient-to-l from-white via-white/90 to-transparent flex items-center justify-center text-slate-500 hover:text-indigo-600 shrink-0"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 단톡방 목록 행 */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          <button onClick={() => setShowCreateRoom(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-purple-600 text-white hover:bg-purple-700 transition shrink-0">
            <Plus size={11} /> 단톡방 만들기
          </button>
          {chatRooms.map((gr) => (
            <button key={gr.id} onClick={() => { setRoom(`group_${gr.id}`); setShowRoomSettings(false); }} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition shrink-0 ${room === `group_${gr.id}` ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"}`}>
              <Users size={11} /> {gr.name}
            </button>
          ))}
          {chatRooms.length === 0 && <span className="text-xs text-slate-400 ml-1">아직 참여 중인 단톡방이 없습니다</span>}
        </div>

        {/* 단톡방 헤더 (설정 버튼) */}
        {isGroupRoom && currentGroupRoom && (
          <div className="bg-purple-50 border-b border-purple-100 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-800">{currentGroupRoom.name}</span>
              <span className="text-xs text-purple-400">{currentGroupRoom.members.length}명</span>
            </div>
            <button onClick={() => setShowRoomSettings(!showRoomSettings)} className="text-purple-500 hover:text-purple-700 transition p-1">
              <Settings size={16} />
            </button>
          </div>
        )}

        {/* 단톡방 설정 패널 */}
        {showRoomSettings && currentGroupRoom && (
          <div className="bg-white border-b border-slate-200 p-4 space-y-3 shrink-0 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-bold text-slate-700">멤버 목록</h4>
            <div className="space-y-1">
              {currentGroupRoom.members.map((memberId) => {
                const [school, role] = memberId.split("_");
                const isOwner = memberId === currentGroupRoom.owner_id;
                const isMyself = memberId === user?.id;
                return (
                  <div key={memberId} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                    <span className="text-slate-700">
                      {(school || "").replace("중학교", "중")} <span className="text-indigo-600">{role}</span>
                      {isOwner && <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">방장</span>}
                    </span>
                    {isRoomOwner && !isMyself && (
                      <button onClick={() => handleKickMember(memberId)} className="text-slate-400 hover:text-red-500 transition" title="내보내기">
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-lg transition">
                <UserPlus size={13} /> 초대하기
              </button>
              <button onClick={handleLeaveRoom} className="flex items-center gap-1 text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded-lg transition ml-auto">
                <LogOut size={13} /> 나가기
              </button>
            </div>
          </div>
        )}

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
                  <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isMe ? "justify-end" : ""}`}>
                    <p className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</p>
                    {isMe && <button onClick={() => handleDeleteMessage(msg.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={11} /></button>}
                  </div>
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

      {/* 단톡방 만들기 모달 */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Users size={18} className="text-purple-600" /> 단톡방 만들기</h3>
              <button onClick={() => { setShowCreateRoom(false); setSelectedMembers([]); setNewRoomName(""); setMemberSearch(""); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <input
              type="text"
              placeholder="단톡방 이름"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-3 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="소속 또는 직책 검색..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-slate-500 mb-2">초대할 멤버 선택 ({selectedMembers.length}명 선택됨)</p>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {renderMemberList(selectedMembers, (id) => toggleMember(id, selectedMembers, setSelectedMembers))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || selectedMembers.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:bg-slate-300 transition"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 초대 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><UserPlus size={18} className="text-indigo-600" /> 멤버 초대</h3>
              <button onClick={() => { setShowInviteModal(false); setInviteMembers([]); setMemberSearch(""); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <input
              type="text"
              placeholder="소속 또는 직책 검색..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-slate-500 mb-2">초대할 멤버 선택 ({inviteMembers.length}명 선택됨)</p>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {renderMemberList(inviteMembers, (id) => toggleMember(id, inviteMembers, setInviteMembers), currentGroupRoom?.members)}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleInviteMembers}
                disabled={inviteMembers.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:bg-slate-300 transition"
              >
                초대하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (<AuthGuard><ChatContent /></AuthGuard>);
}
