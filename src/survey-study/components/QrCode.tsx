"use client";

import { useEffect, useRef, useState } from "react";

/** qrcode 라이브러리를 동적 로드해 배포 링크의 QR을 그린다 */
export default function QrCode({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const QR = (await import("qrcode")).default;
        if (cancelled || !canvasRef.current) return;
        await QR.toCanvas(canvasRef.current, text, {
          width: 220,
          margin: 2,
          color: { dark: "#1e293b", light: "#ffffff" },
        });
      } catch {
        if (!cancelled) setErr("QR 생성 실패");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-slate-200"
      />
      {err && <p className="text-xs text-red-500">{err}</p>}
      <p className="max-w-[220px] break-all text-center text-xs text-slate-400">
        {text}
      </p>
    </div>
  );
}
