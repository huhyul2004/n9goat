"use client";

import { useToast } from "@/store/useToast";
import { X, MessageCircle, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function ToastContainer() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-3 pr-10 rounded-xl shadow-lg border backdrop-blur-sm animate-in slide-in-from-right fade-in duration-300 ${
            t.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : t.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
          ) : t.type === "error" ? (
            <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          ) : t.message.includes("메일") ? (
            <Mail size={18} className="text-indigo-500 mt-0.5 shrink-0" />
          ) : (
            <MessageCircle size={18} className="text-indigo-500 mt-0.5 shrink-0" />
          )}
          <p className="text-sm leading-snug">{t.message}</p>
          <button
            onClick={() => remove(t.id)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
