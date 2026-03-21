"use client";

import { useState, useRef, useEffect } from "react";
import { User, Mail, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileTooltipProps {
  authorSchool: string;
  authorRole: string;
  authorId: string;
}

export default function ProfileTooltip({ authorSchool, authorRole, authorId }: ProfileTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold flex-shrink-0 hover:bg-indigo-100 hover:text-indigo-600 transition-colors focus:outline-none ring-2 ring-transparent hover:ring-indigo-200"
        title="프로필 보기"
      >
        <User size={22} />
      </button>

      {open && (
        <div className="absolute top-0 left-14 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-30 w-40 sm:w-44">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-sm font-bold text-slate-800">{authorSchool}</p>
            <p className="text-xs text-indigo-600 font-medium">{authorRole}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              router.push(`/profile?user_id=${encodeURIComponent(authorId)}`);
            }}
            className="w-full flex items-center gap-2 text-sm text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
          >
            <MessageSquare size={16} /> 작성 글 보기
          </button>
          <button
            onClick={() => {
              setOpen(false);
              router.push(
                `/mail/compose?to_id=${encodeURIComponent(authorId)}&to_school=${encodeURIComponent(authorSchool)}&to_role=${encodeURIComponent(authorRole)}`
              );
            }}
            className="w-full flex items-center gap-2 text-sm text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
          >
            <Mail size={16} /> 메일 보내기
          </button>
        </div>
      )}
    </div>
  );
}
