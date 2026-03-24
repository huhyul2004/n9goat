"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";
import { getCredential, createCredential } from "@/lib/db";
import { SCHOOLS, SCHOOL_LIST, ROLES } from "@/lib/constants";
import type { School, Role } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState<School>(SCHOOL_LIST[0] as School);
  const [role, setRole] = useState<Role>(ROLES[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const { login, user, init, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (initialized && user) router.replace("/board");
  }, [initialized, user, router]);

  // 교육감 직책 선택 시 소속 강제 설정
  useEffect(() => {
    if (role === "교육감") {
      setSchool("교육감" as School);
    } else if (school === "교육감") {
      setSchool(SCHOOL_LIST[0] as School);
    }
  }, [role]);

  // 소속/직책 변경 시 신규 계정 여부 확인
  useEffect(() => {
    checkAccount();
  }, [school, role]);

  async function checkAccount() {
    setChecking(true);
    setPassword("");
    setConfirmPassword("");
    setError("");
    const accountId = `${school}_${role}`;

    // 개발자는 항상 기존 계정 (비밀번호 4928 고정)
    if (role === "개발자") {
      setIsNewAccount(false);
      setChecking(false);
      return;
    }

    const cred = await getCredential(accountId);
    setIsNewAccount(!cred);
    setChecking(false);
  }

  function goAfterLogin() {
    const seen = localStorage.getItem("n9_landing_seen");
    router.push(seen ? "/board" : "/landing");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    const accountId = `${school}_${role}`;

    // 개발자 직책: 고정 비밀번호 4928
    if (role === "개발자") {
      if (password !== "4928") {
        setError("개발자 비밀번호가 올바르지 않습니다.");
        setSubmitting(false);
        return;
      }
      await login(name.trim(), school, role);
      goAfterLogin();
      return;
    }

    if (isNewAccount) {
      // 신규 계정: 비밀번호 설정
      if (password.length < 4) {
        setError("비밀번호는 4자리 이상이어야 합니다.");
        setSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다.");
        setSubmitting(false);
        return;
      }
      const ok = await createCredential(accountId, password);
      if (!ok) {
        setError("계정 생성에 실패했습니다. 다시 시도해주세요.");
        setSubmitting(false);
        return;
      }
      await login(name.trim(), school, role);
      goAfterLogin();
    } else {
      // 기존 계정: 비밀번호 확인
      const cred = await getCredential(accountId);
      if (!cred || cred.password !== password) {
        setError("비밀번호가 올바르지 않습니다.");
        setSubmitting(false);
        return;
      }
      await login(name.trim(), school, role);
      goAfterLogin();
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white tracking-tight">N9</h1>
          <div className="w-12 h-1 bg-indigo-500 mt-4 rounded-full" />
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">울산 남구<br />중학교 커뮤니티</h2>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">16개 중학교가 하나로 연결됩니다.<br />질문하고, 소통하고, 함께 성장하세요.</p>
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
        <p className="relative z-10 text-sm text-slate-600">&copy; 2026 N9 Community. 울산광역시 남구 교육 네트워크</p>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden mb-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">N9</h1>
              <div className="w-10 h-1 bg-indigo-500 mt-3 rounded-full mx-auto" />
              <p className="text-slate-500 mt-3 text-sm leading-relaxed">울산 남구 중학교 커뮤니티<br />16개 중학교가 하나로 연결됩니다.</p>
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
            <p className="text-slate-500 mt-1">소속과 직책을 선택하고 비밀번호를 입력하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">이름</label>
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
              <label className="block text-sm font-semibold text-slate-800 mb-2">소속</label>
              {role === "교육감" ? (
                <div className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 font-medium">
                  교육감
                </div>
              ) : (
                <select
                  value={school}
                  onChange={(e) => setSchool(e.target.value as School)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
                >
                  {SCHOOL_LIST.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">직책</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900"
              >
                {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>

            {/* 상태 안내 */}
            {!checking && isNewAccount !== null && (
              <div className={`text-xs p-3 rounded-xl font-medium ${isNewAccount ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                {role === "개발자"
                  ? "개발자 계정은 지정된 비밀번호가 필요합니다."
                  : isNewAccount
                  ? "이 소속/직책으로 처음 접속합니다. 비밀번호를 설정해주세요."
                  : "기존 계정이 있습니다. 비밀번호를 입력해주세요."}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                {isNewAccount && role !== "개발자" ? "비밀번호 설정" : "비밀번호"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isNewAccount && role !== "개발자" ? "비밀번호를 설정하세요 (4자리 이상)" : "비밀번호를 입력하세요"}
                  className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 (신규 계정만) */}
            {isNewAccount && role !== "개발자" && (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">비밀번호 확인</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || checking}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl transition-colors"
            >
              {submitting ? "접속 중..." : isNewAccount && role !== "개발자" ? "회원가입" : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
