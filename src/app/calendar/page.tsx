"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/store/useToast";
import { fetchEvents, createEvent, deleteEvent } from "@/lib/db";
import { SCHOOL_LIST } from "@/lib/constants";
import type { CalendarEvent } from "@/lib/types";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { ChevronLeft, ChevronRight, Plus, X, Trash2, CalendarDays, School, ArrowLeft, Globe } from "lucide-react";

function CalendarContent() {
  const { user } = useAuth();
  const toast = useToast();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("전체");

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => { load(); }, [monthKey]);

  async function load() {
    setEvents(await fetchEvents(monthKey));
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  async function handleAddEvent() {
    if (!user || !newTitle.trim() || !selectedDate) return;
    await createEvent({
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: selectedDate,
      author_school: selectedSchool || user.school,
      author_role: user.role,
      author_id: user.id,
    });
    setNewTitle(""); setNewDesc(""); setShowAdd(false);
    toast.add("일정이 등록되었습니다", "success");
    load();
  }

  async function handleDelete(id: string) {
    await deleteEvent(id);
    toast.add("일정이 삭제되었습니다", "success");
    load();
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  // 필터링: 전체=모든 일정, 학교 선택 시 해당 학교만
  const filteredEvents = selectedSchool === "전체"
    ? events
    : events.filter((e) => e.author_school === selectedSchool);

  const eventsForDate = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return filteredEvents.filter((e) => e.date === dateStr);
  };

  const selectedEvents = selectedDate ? filteredEvents.filter((e) => e.date === selectedDate) : [];
  const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const DAYNAMES = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-3xl mx-auto p-3 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="text-indigo-600" size={22} /> Calendar
            </h2>
          </div>

          {/* 학교 선택 뱃지 */}
          {selectedSchool !== "전체" && (
            <button
              onClick={() => { setSelectedSchool("전체"); setSelectedDate(null); }}
              className="flex items-center gap-2 mb-4 bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition"
            >
              <ArrowLeft size={16} />
              {selectedSchool.replace("중학교", "중")} 학사일정
              <X size={14} className="ml-1 opacity-70" />
            </button>
          )}

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3 md:mb-4 bg-white rounded-xl border border-slate-200 px-4 py-3">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg active:bg-slate-200"><ChevronLeft size={20} /></button>
            <span className="font-bold text-slate-800">{year}년 {MONTHS[month]}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg active:bg-slate-200"><ChevronRight size={20} /></button>
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4 md:mb-6">
            <div className="grid grid-cols-7">
              {DAYNAMES.map((d, i) => (
                <div key={d} className={`text-center text-[11px] md:text-xs font-medium py-2 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-slate-500"}`}>{d}</div>
              ))}
            </div>
            {weeks.map((w, wi) => (
              <div key={wi} className="grid grid-cols-7 border-t border-slate-100">
                {w.map((d, di) => {
                  if (d === null) return <div key={di} className="h-12 md:h-16 bg-slate-50/50" />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const dayEvents = eventsForDate(d);
                  const isToday = dateStr === today.toISOString().slice(0, 10);
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button key={di} onClick={() => setSelectedDate(dateStr)} className={`h-12 md:h-16 pt-0.5 md:pt-1 px-0.5 md:px-1 text-left transition active:bg-indigo-100 hover:bg-indigo-50 relative flex flex-col items-center ${isSelected ? "bg-indigo-50 ring-2 ring-indigo-400 ring-inset" : ""}`}>
                      <span className={`text-[11px] md:text-xs leading-none ${isToday ? "bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center" : di === 0 ? "text-red-400" : di === 6 ? "text-blue-400" : "text-slate-700"}`}>{d}</span>
                      {dayEvents.length > 0 && (
                        <>
                          {/* Desktop: show titles */}
                          <div className="hidden md:block mt-0.5 space-y-0.5 w-full">
                            {dayEvents.slice(0, 2).map((e) => (
                              <div key={e.id} className={`text-[9px] rounded px-1 truncate ${selectedSchool !== "전체" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>{e.title}</div>
                            ))}
                            {dayEvents.length > 2 && <div className="text-[9px] text-slate-400 px-1">+{dayEvents.length - 2}</div>}
                          </div>
                          {/* Mobile: show dot */}
                          <div className="md:hidden flex justify-center mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedSchool !== "전체" ? "bg-emerald-500" : "bg-indigo-500"}`} />
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected date events */}
          {selectedDate && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 mb-4 md:mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm md:text-base">{selectedDate}</h3>
                <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition active:bg-indigo-800"><Plus size={14} /> 일정 추가</button>
              </div>

              {showAdd && (
                <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                  <input type="text" placeholder="일정 제목" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm mb-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                  <textarea placeholder="설명 (선택)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm mb-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                  <div className="flex gap-2">
                    <button onClick={handleAddEvent} disabled={!newTitle.trim()} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:bg-slate-300">등록</button>
                    <button onClick={() => setShowAdd(false)} className="text-xs text-slate-500 px-3 py-2">취소</button>
                  </div>
                </div>
              )}

              {selectedEvents.length === 0 && !showAdd ? (
                <p className="text-sm text-slate-400">이 날짜에 일정이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((e) => (
                    <div key={e.id} className="flex items-start justify-between bg-slate-50 rounded-lg p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">{e.title}</p>
                        {e.description && <p className="text-xs text-slate-500 mt-0.5">{e.description}</p>}
                        <p className="text-xs text-slate-400 mt-1">{e.author_school.replace("중학교", "중")} · {e.author_role}</p>
                      </div>
                      {user?.id === e.author_id && (
                        <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-red-500 p-2 shrink-0"><Trash2 size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 캘린더 필터 선택 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <School size={18} className="text-emerald-600" />
              캘린더 선택
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              <button
                onClick={() => { setSelectedSchool("전체"); setSelectedDate(null); }}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition border ${
                  selectedSchool === "전체"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700"
                }`}
              >
                <Globe size={14} className={selectedSchool === "전체" ? "text-white" : "text-slate-400"} />
                <span>전체</span>
              </button>
              {SCHOOL_LIST.map((school) => (
                <button
                  key={school}
                  onClick={() => { setSelectedSchool(school); setSelectedDate(null); }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition border ${
                    selectedSchool === school
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700"
                  }`}
                >
                  <School size={14} className={selectedSchool === school ? "text-white" : "text-slate-400"} />
                  <span className="truncate">{school.replace("중학교", "중")}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CalendarPage() {
  return (<AuthGuard><CalendarContent /></AuthGuard>);
}
