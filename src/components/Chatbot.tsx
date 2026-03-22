"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, btnX: 0, btnY: 0 });
  const hasMoved = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const getDefaultPos = useCallback(() => {
    const mobile = window.innerWidth < 768;
    return {
      x: window.innerWidth - (mobile ? 16 + 48 : 24 + 56),
      y: window.innerHeight - (mobile ? 72 + 48 : 24 + 56),
    };
  }, []);

  useEffect(() => {
    setPos(getDefaultPos());
    setIsMobile(window.innerWidth < 768);
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (!dragging.current) setPos(getDefaultPos());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getDefaultPos]);

  // Pointer-based drag (works for both mouse and touch)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    hasMoved.current = false;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragStart.current = { x: e.clientX, y: e.clientY, btnX: rect.left, btnY: rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
    const btn = btnRef.current;
    const size = btn ? btn.offsetWidth : 56;
    const newX = Math.max(0, Math.min(window.innerWidth - size, dragStart.current.btnX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - size, dragStart.current.btnY + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "죄송해요, 오류가 발생했어요. 다시 시도해주세요!",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - draggable, hidden on mobile when chat is open */}
      {pos && !(isOpen && isMobile) && (
        <button
          ref={btnRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => { if (!hasMoved.current) setIsOpen(!isOpen); }}
          className={`fixed z-[70] flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full shadow-lg select-none touch-none ${
            isOpen
              ? "bg-gray-500 hover:bg-gray-600"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          style={{ left: pos.x, top: pos.y }}
          aria-label={isOpen ? "챗봇 닫기" : "챗봇 열기"}
        >
          {isOpen ? (
            <X className="h-5 w-5 md:h-6 md:w-6 text-white pointer-events-none" />
          ) : (
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white pointer-events-none" />
          )}
        </button>
      )}

      {/* Chat Window - fullscreen on mobile, floating on desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white dark:bg-gray-900 h-[100dvh] md:inset-auto md:bottom-24 md:right-6 md:h-[500px] md:w-[380px] md:rounded-2xl md:border md:border-gray-200 md:shadow-2xl md:dark:border-gray-700">
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 text-white safe-area-top">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              <div className="flex-1">
                <h3 className="font-bold">허남구</h3>
                <p className="text-xs text-blue-100">
                  울산 남구 중학생 AI 도우미
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 hover:bg-blue-400 transition-colors"
                aria-label="챗봇 닫기"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                <Bot className="mb-3 h-12 w-12 text-blue-300" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  안녕하세요! 허남구입니다 👋
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  학교생활, 학습, 진로 등<br />
                  궁금한 게 있으면 물어보세요!
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 pb-safe dark:border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="궁금한 것을 물어보세요..."
                className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:bg-gray-700"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
