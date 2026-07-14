"use client";

export const dynamic = "force-dynamic";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, BarChart3, Megaphone, CalendarDays, FileText } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { fetchPosts, fetchPolls, fetchEvents } from "@/lib/db";

// 위젯 딥링크(n9://recent/{category})가 도착하는 인앱 화면.
// 4개 카테고리 각각 최신 6개를 리스트로 보여주고, 탭하면 기존 상세 화면으로 이동.

type Category = "poll" | "notice" | "calendar" | "post";

const CATEGORY_META: Record<
  Category,
  { title: string; icon: typeof BarChart3; accent: string }
> = {
  poll: { title: "최근 투표", icon: BarChart3, accent: "text-amber-500" },
  notice: { title: "최근 공지", icon: Megaphone, accent: "text-rose-500" },
  calendar: { title: "다음 일정", icon: CalendarDays, accent: "text-sky-500" },
  post: { title: "최근 게시글", icon: FileText, accent: "text-indigo-500" },
};

interface ListItem {
  id: string;
  title: string;
  subtitle: string;
  onOpen: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function dDayLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff > 0) return `D-${diff}`;
  return `${-diff}일 지남`;
}

function RecentContent({ category }: { category: Category }) {
  const router = useRouter();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let next: ListItem[] = [];

      if (category === "notice" || category === "post") {
        const posts = await fetchPosts(
          category === "notice" ? "announcement" : "question"
        );
        next = posts.slice(0, 6).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: `${p.author_school} · ${formatDate(p.created_at)}`,
          onOpen: () => router.push(`/board?post=${p.id}`),
        }));
      } else if (category === "poll") {
        const polls = await fetchPolls();
        next = polls.slice(0, 6).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: `참여 ${Object.keys(p.votes || {}).length}명 · ${formatDate(p.created_at)}`,
          onOpen: () => router.push(`/poll`),
        }));
      } else if (category === "calendar") {
        const events = await fetchEvents();
        const todayStr = new Date().toISOString().slice(0, 10);
        const upcoming = events
          .filter((e) => e.date >= todayStr)
          .sort((a, b) => a.date.localeCompare(b.date));
        // 다가오는 일정이 없으면 최신 등록순으로 폴백
        const chosen = upcoming.length > 0 ? upcoming : events;
        next = chosen.slice(0, 6).map((e) => ({
          id: e.id,
          title: e.title,
          subtitle: `${formatDate(e.date)} · ${dDayLabel(e.date)}`,
          onOpen: () => router.push(`/calendar`),
        }));
      }

      if (!cancelled) {
        setItems(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, router]);

  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <main className="min-h-screen min-h-[100dvh] bg-slate-50 dark:bg-slate-950">
      {/* 상단 바 */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <button
          onClick={() => router.push("/board")}
          aria-label="뒤로가기"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeft size={22} />
        </button>
        <Icon size={20} className={meta.accent} />
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {meta.title}
        </h1>
      </header>

      <div className="mx-auto max-w-xl space-y-2 p-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">
            아직 항목이 없어요.
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={item.onOpen}
              className="flex w-full flex-col gap-0.5 rounded-2xl bg-slate-100 p-4 text-left transition-colors hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-800"
            >
              <span className="line-clamp-1 font-semibold text-slate-900 dark:text-slate-100">
                {item.title}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.subtitle}
              </span>
            </button>
          ))
        )}
      </div>
    </main>
  );
}

const VALID: Category[] = ["poll", "notice", "calendar", "post"];

export default function RecentCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);
  const cat = VALID.includes(category as Category)
    ? (category as Category)
    : null;

  if (!cat) {
    return (
      <main className="flex min-h-screen min-h-[100dvh] items-center justify-center text-slate-400">
        알 수 없는 카테고리입니다.
      </main>
    );
  }

  return (
    <AuthGuard>
      <RecentContent category={cat} />
    </AuthGuard>
  );
}
