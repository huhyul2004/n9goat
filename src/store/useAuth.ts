"use client";

import { create } from "zustand";
import type { Profile } from "@/lib/types";
import type { School, Role } from "@/lib/constants";
import { seedIfEmpty } from "@/lib/seed";
import { migrateUserId } from "@/lib/db";

// ============================================================
// LOCAL MOCK MODE — 소속/직책 선택으로 로그인
// 실제 배포 시 원래 useAuth.ts 로 복원 필요
// ============================================================

interface AuthState {
  user: Profile | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (name: string, school: School, role: Role) => Promise<string | null>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    school: School;
    role: Role;
  }) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    // 기존 mock 데이터 초기화
    if (typeof window !== "undefined") {
      localStorage.removeItem("n9_mock_seeded");
    }
    seedIfEmpty();
    // 저장된 유저 복원
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("n9_current_user");
      if (saved) {
        set({ user: JSON.parse(saved), loading: false, initialized: true });
        return;
      }
    }
    set({ loading: false, initialized: true });
  },

  login: async (name: string, school: School, role: Role) => {
    const trimmedName = name.trim();
    // 소속+직책+이름 조합으로 고정 ID 생성 (같은 소속+직책+이름 = 같은 계정)
    const stableId = `${school}_${role}_${trimmedName}`;
    // 기존 소속_직책 형식 ID → 새 형식으로 마이그레이션
    const oldId = `${school}_${role}`;
    try {
      await migrateUserId(oldId, stableId);
    } catch (e) {
      console.warn("[login] migrateUserId failed:", e);
    }

    const isAdmin = ["교육감", "교장", "교감"].includes(role);
    const user: Profile = {
      id: stableId,
      email: "",
      name: trimmedName,
      phone: "",
      school,
      role,
      is_admin: isAdmin,
      created_at: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("n9_current_user", JSON.stringify(user));
    }
    set({ user, loading: false, initialized: true });
    return null;
  },

  signup: async ({ name, school, role }) => {
    const trimmedName = name.trim();
    const stableId = `${school}_${role}_${trimmedName}`;
    const oldId = `${school}_${role}`;
    try {
      await migrateUserId(oldId, stableId);
    } catch (e) {
      console.warn("[signup] migrateUserId failed:", e);
    }

    const isAdmin = ["교육감", "교장", "교감"].includes(role);
    const user: Profile = {
      id: stableId,
      email: "",
      name: trimmedName,
      phone: "",
      school,
      role,
      is_admin: isAdmin,
      created_at: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("n9_current_user", JSON.stringify(user));
    }
    set({ user, loading: false, initialized: true });
    return null;
  },

  logout: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("n9_current_user");
    }
    set({ user: null });
  },

  refreshProfile: async () => {
    // no-op in mock mode
  },
}));
