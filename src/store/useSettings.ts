"use client";

import { create } from "zustand";

interface SettingsState {
  showBackground: boolean;
  darkMode: boolean;
  avatar: string | null; // base64 data URL
  setShowBackground: (val: boolean) => void;
  setDarkMode: (val: boolean) => void;
  setAvatar: (val: string | null) => void;
  init: () => void;
}

export const useSettings = create<SettingsState>()((set) => ({
  showBackground: false,
  darkMode: false,
  avatar: null,

  init: () => {
    if (typeof window === "undefined") return;
    const bg = localStorage.getItem("n9_settings_background");
    const dark = localStorage.getItem("n9_settings_darkmode");
    const av = localStorage.getItem("n9_settings_avatar");
    set({
      showBackground: bg === "true",
      darkMode: dark === "true",
      avatar: av || null,
    });
    // Apply dark mode class
    if (dark === "true") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },

  setShowBackground: (val: boolean) => {
    if (typeof window !== "undefined") localStorage.setItem("n9_settings_background", String(val));
    set({ showBackground: val });
  },

  setDarkMode: (val: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("n9_settings_darkmode", String(val));
      if (val) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
    set({ darkMode: val });
  },

  setAvatar: (val: string | null) => {
    if (typeof window !== "undefined") {
      if (val) localStorage.setItem("n9_settings_avatar", val);
      else localStorage.removeItem("n9_settings_avatar");
    }
    set({ avatar: val });
  },
}));
