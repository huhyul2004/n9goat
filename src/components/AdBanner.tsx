"use client";

import { useState, useEffect } from "react";
import { GraduationCap, ExternalLink } from "lucide-react";

const ADS = [
  {
    school: "강남고등학교",
    slogan: "꿈을 현실로, 강남고와 함께!",
    desc: "명문 진학의 시작, 강남고등학교가 여러분의 미래를 응원합니다.",
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    badge: "bg-blue-500/20 text-blue-300",
  },
  {
    school: "언양고등학교",
    slogan: "자연 속에서 키우는 큰 꿈",
    desc: "풍부한 자연환경과 함께하는 인성교육, 언양고등학교입니다.",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  {
    school: "방어진고등학교",
    slogan: "바다처럼 넓은 가능성",
    desc: "동구의 자랑, 방어진고에서 무한한 가능성을 펼치세요.",
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    badge: "bg-orange-500/20 text-orange-300",
  },
];

export function AdBannerSidebar() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % ADS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const ad = ADS[idx];

  return (
    <div className={`mx-3 mb-3 p-3 rounded-xl border ${ad.border} ${ad.bg} transition-all duration-500`}>
      <div className="flex items-center gap-2 mb-1.5">
        <GraduationCap size={14} className={ad.text} />
        <span className={`text-[10px] font-bold ${ad.badge} px-1.5 py-0.5 rounded-full`}>AD</span>
        <span className={`text-xs font-bold ${ad.text}`}>{ad.school}</span>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">{ad.slogan}</p>
      <div className="flex gap-1 mt-2">
        {ADS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1 rounded-full transition-all ${i === idx ? `w-4 bg-gradient-to-r ${ad.color}` : "w-1.5 bg-slate-700"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function AdBannerBoard() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % ADS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const ad = ADS[idx];

  return (
    <div className={`mb-5 p-4 rounded-2xl border border-slate-200 bg-white transition-all duration-500 overflow-hidden relative`}>
      <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${ad.color}`} />
      <div className="relative flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ad.bg.replace("/10", "/20").replace("bg-", "bg-")}`} style={{ background: `linear-gradient(135deg, ${ad.color.includes("blue") ? "#3b82f6" : ad.color.includes("emerald") ? "#10b981" : "#f97316"}22, transparent)` }}>
          <GraduationCap size={20} className={ad.color.includes("blue") ? "text-blue-500" : ad.color.includes("emerald") ? "text-emerald-500" : "text-orange-500"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">AD</span>
            <span className="text-sm font-bold text-slate-800">{ad.school}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{ad.desc}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {ADS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? `w-5 bg-gradient-to-r ${ad.color}` : "w-1.5 bg-slate-200"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
