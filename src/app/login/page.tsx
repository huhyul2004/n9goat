"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { SCHOOLS, ROLES } from "@/lib/constants";
import type { School, Role } from "@/lib/constants";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState<School>(SCHOOLS[0]);
  const [role, setRole] = useState<Role>(ROLES[0]); // 교육감 (관리자) default
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, user, init, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (initialized && user) {
      router.replace("/board");
    }
  }, [initialized, user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    const err = await login(name.trim(), school, role);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    router.push("/board");
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-between p-12">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white tracking-tight">
            N9
          </h1>
          <div className="w-12 h-1 bg-indigo-500 mt-4 rounded-full" />
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              울산 남구<br />
              중학교 커뮤니티
            </h2>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">
              16개 중학교가 하나로 연결됩니다.<br />
              질문하고, 소통하고, 함께 성장하세요.
            </p>
          </div>

          <div className="flex gap-6">
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 flex-1">
              <p className="text-3xl font-black text-indigo-400">16</p>
              <p className="text-sm text-slate-400 mt-1">참여 학교</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 flex-1">
              <p className="text-3xl font-black text-emerald-400">Q&A</p>
              <p className="text-sm text-slate-400 mt-1">질문 게시판</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-5 flex-1">
              <p className="text-3xl font-black text-amber-400">Live</p>
              <p className="text-sm text-slate-400 mt-1">실시간 채팅</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-slate-600">
          &copy; 2026 N9 Community. 울산광역시 남구 교육 네트워크
        </p>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden mb-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">N9</h1>
              <div className="w-10 h-1 bg-indigo-500 mt-3 rounded-full mx-auto" />
              <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                울산 남구 중학교 커뮤니티<br />
                16개 중학교가 하나로 연결됩니다.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 text-center">
                <p className="text-xl font-black text-indigo-500">16</p>
                <p className="text-[11px] text-slate-400 mt-0.5">참여 학교</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 text-center">
                <p className="text-xl font-black text-emerald-500">Q&A</p>
                <p className="text-[11px] text-slate-400 mt-0.5">질문 게시판</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 text-center">
                <p className="text-xl font-black text-amber-500">Live</p>
                <p className="text-[11px] text-slate-400 mt-0.5">실시간 채팅</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-2xl font-bold text-slate-900">로그인</h2>
            <p className="text-slate-500 mt-1">소속과 직책을 선택해주세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                이름
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                소속
              </label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value as School)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
              >
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                직책
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl transition-colors"
            >
              {submitting ? "접속 중..." : "접속하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
