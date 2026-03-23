"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/useAuth";

export default function Home() {
  const { user, initialized, init } = useAuth();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace("/login");
    } else {
      const seen = localStorage.getItem("n9_landing_seen");
      router.replace(seen ? "/board" : "/landing");
    }
  }, [user, initialized, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
