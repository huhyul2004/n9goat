"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { supabase } from "@/lib/supabase";
import type { InviteCode } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Copy, Check, Plus, Link2, Trash2 } from "lucide-react";
import { ANNOUNCEMENT_ROLES } from "@/lib/constants";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function InviteContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const isAdmin = user && ANNOUNCEMENT_ROLES.includes(user.role);

  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/board");
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    loadCodes();
  }, []);

  async function loadCodes() {
    const { data } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes((data as InviteCode[]) || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    const code = generateCode();
    await supabase.from("invite_codes").insert({
      code,
      created_by: user.id,
      label: label.trim() || `초대 링크 ${codes.length + 1}`,
    });

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "create_invite",
      target_table: "invite_codes",
      details: { code, label: label.trim() },
    });

    setLabel("");
    setCreating(false);
    loadCodes();
  }

  async function handleToggle(id: string, currentActive: boolean) {
    await supabase
      .from("invite_codes")
      .update({ is_active: !currentActive })
      .eq("id", id);
    loadCodes();
  }

  async function handleDelete(id: string) {
    await supabase.from("invite_codes").delete().eq("id", id);
    loadCodes();
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Link2 size={24} /> 초대 링크 관리
          </h1>

          {/* Create new code */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              새 초대 링크 만들기
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="설명 (예: 신정중 선생님용)"
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm"
              >
                <Plus size={16} /> 생성
              </button>
            </div>
          </div>

          {/* Code list */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              생성된 초대 링크가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {codes.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border p-4 ${
                    c.is_active
                      ? "border-slate-100"
                      : "border-red-100 bg-red-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {c.label || "초대 링크"}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {c.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          c.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {c.is_active ? "활성" : "비활성"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {c.used_count}명 사용
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => copyLink(c.code)}
                      className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      {copied === c.code ? (
                        <>
                          <Check size={14} /> 복사됨
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 링크 복사
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleToggle(c.id, c.is_active)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                        c.is_active
                          ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                          : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                    >
                      {c.is_active ? "비활성화" : "활성화"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminInvitePage() {
  return (
    <AuthGuard>
      <InviteContent />
    </AuthGuard>
  );
}
