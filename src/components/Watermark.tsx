"use client";

import { useEffect } from "react";
import { useSettings } from "@/store/useSettings";

export default function Watermark() {
  const { showBackground, init } = useSettings();

  useEffect(() => {
    init();
  }, [init]);

  if (!showBackground) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] flex items-center justify-center overflow-hidden">
      <p
        className="text-[8vw] font-black text-slate-300/10 whitespace-nowrap select-none"
        style={{ transform: "rotate(-20deg)" }}
      >
        남구 학교 커뮤니티
      </p>
    </div>
  );
}
