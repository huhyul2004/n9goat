"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createMail } from "@/lib/db";
import { useAuth } from "@/store/useAuth";
import { SCHOOLS, SCHOOL_LIST, ROLES } from "@/lib/constants";
import type { School, Role } from "@/lib/constants";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { ArrowLeft, User, Send } from "lucide-react";

function ComposeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const prefilledSchool = searchParams.get("to_school") || "";
  const prefilledRole = searchParams.get("to_role") || "";
  const prefilledId = searchParams.get("to_id") || "";

  const prefilledName = searchParams.get("to_name") || "";

  const [toSchool, setToSchool] = useState<School | "">(prefilledSchool as School | "");
  const [toRole, setToRole] = useState<Role | "">(prefilledRole as Role | "");
  const [toName, setToName] = useState(prefilledName);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!user || !toSchool || !toRole || !toName.trim() || !message.trim()) return;

    setSending(true);
    const targetId = prefilledId || `${toSchool}_${toRole}_${toName.trim()}`;

    const ok = await createMail({
      from_id: user.id,
      from_school: user.school,
      from_role: user.role,
      to_id: targetId,
      to_school: toSchool,
      to_role: toRole,
      subject: subject.trim() || "(제목 없음)",
      body: message.trim(),
    });

    if (ok) {
      router.push("/mail");
    } else {
      alert("메일 전송에 실패했습니다.");
    }
    setSending(false);
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-3 md:p-8 h-full flex flex-col">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-4 md:mb-6 transition-colors w-fit p-1"
          >
            <ArrowLeft size={20} /> 뒤로가기
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
            {/* Recipient Header */}
            <div className="p-3.5 md:p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium">받는 사람</p>
                {prefilledSchool && prefilledRole && prefilledName ? (
                  <p className="font-bold text-slate-800 text-sm md:text-base">
                    {prefilledSchool} {prefilledRole} {prefilledName}
                  </p>
                ) : (
                  <div className="space-y-2 mt-1">
                    <div className="flex gap-2">
                      <select
                        value={toSchool}
                        onChange={(e) => setToSchool(e.target.value as School)}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none flex-1 min-w-0"
                      >
                        <option value="">학교 선택</option>
                        {SCHOOL_LIST.map((s) => (
                          <option key={s} value={s}>{s.replace("중학교", "중")}</option>
                        ))}
                      </select>
                      <select
                        value={toRole}
                        onChange={(e) => setToRole(e.target.value as Role)}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">직책</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      placeholder="받는 사람 이름"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="px-3.5 md:px-4 pt-3">
              <input
                type="text"
                placeholder="제목"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2.5 border-b border-slate-100 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Textarea */}
            <div className="flex-1 p-3.5 md:p-4 relative min-h-[200px]">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="내용을 입력하세요..."
                className="w-full h-full resize-none outline-none text-slate-700 text-sm md:text-base leading-7 md:leading-8 bg-transparent z-10 relative"
                style={{
                  backgroundImage: "linear-gradient(transparent, transparent calc(100% - 1px), #e2e8f0 calc(100% - 1px))",
                  backgroundSize: "100% 28px",
                }}
              />
            </div>

            {/* Send Button */}
            <div className="p-3.5 md:p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending || !toSchool || !toRole || !toName.trim() || !message.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none text-sm"
              >
                <Send size={16} /> {sending ? "전송 중..." : "전송하기"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MailComposePage() {
  return (
    <AuthGuard>
      <Suspense>
        <ComposeContent />
      </Suspense>
    </AuthGuard>
  );
}
