"use client";

import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error";
}

interface ToastState {
  toasts: Toast[];
  add: (message: string, type?: Toast["type"]) => void;
  remove: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  add: (message, type = "info") => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
