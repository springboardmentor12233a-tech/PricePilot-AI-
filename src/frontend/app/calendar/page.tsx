"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or ""
  done: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function decodeUser(token: string): string {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part)).sub || "guest";
  } catch {
    return "guest";
  }
}

function formatClock(d: Date, hour12: boolean) {
  let h = d.getHours();
  let suffix = "";
  if (hour12) {
    suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }
  return { time: `${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`, suffix };
}

function icsLocal(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

const icsEscape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, " ");

export default function CalendarPage() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [hour12, setHour12] = useState(true);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);
  const [selected, setSelected] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageKey, setStorageKey] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  // Auth check, load saved tasks, set today
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const key = `pricepilot_tasks_${decodeUser(token)}`;
    setStorageKey(key);
    try {
      const raw = localStorage.getItem(key);
      if (raw) setTasks(JSON.parse(raw));
    } catch {}
    const t = new Date();
    setNow(t);
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelected(toKey(t.getFullYear(), t.getMonth(), t.getDate()));
    setLoaded(true);
  }, []);

  // Live clock: ticks every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (!loaded || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {}
  }, [tasks, loaded, storageKey]);

  if (!loaded || !now) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="muted-text mono">Loading calendar...</p>
      </div>
    );
  }

  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());
  const { time, suffix } = formatClock(now, hour12);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const countByDate: Record<string, { total: number; open: number }> = {};
  tasks.forEach((t) => {
    const c = countByDate[t.date] || { total: 0, open: 0 };
    c.total += 1;
    if (!t.done) c.open += 1;
    countByDate[t.date] = c;
  });

  const selectedTasks = tasks
    .filter((t) => t.date === selected)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const upcoming = tasks
    .filter((t) => !t.done && t.date >= todayKey)
    .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")))
    .slice(0, 5);
  const overdueCount = tasks.filter((t) => !t.done && t.date < todayKey).length;
  const openTasks = tasks.filter((t) => !t.done);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function goToday() {
    setViewYear(now!.getFullYear());
    setViewMonth(now!.getMonth());
    setSelected(todayKey);
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !selected) return;
    const task: Task = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      title: title.slice(0, 120),
      date: selected,
      time: newTime,
      done: false,
    };
    setTasks([...tasks, task]);
    setNewTitle("");
    setNewTime("");
  }

  function toggleTask(id: string) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTask(id: string) {
    setTasks(tasks.filter((t) => t.id !== id));
  }

  function exportICS() {
    if (openTasks.length === 0) return;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PricePilot AI//Calendar//EN"];
    openTasks.forEach((t) => {
      lines.push("BEGIN:VEVENT", `UID:${t.id}@pricepilot.ai`, `DTSTAMP:${stamp}`);
      if (t.time) {
        const start = new Date(`${t.date}T${t.time}:00`);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        lines.push(`DTSTART:${icsLocal(start)}`, `DTEND:${icsLocal(end)}`);
      } else {
        lines.push(`DTSTART;VALUE=DATE:${t.date.replace(/-/g, "")}`);
      }
      lines.push(`SUMMARY:${icsEscape(t.title)}`, "END:VEVENT");
    });
    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pricepilot-calendar.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedDate = selected ? new Date(`${selected}T00:00:00`) : now;

  return (
    <div className="min-h-screen">
      <div className="status-strip px-8 py-4 flex items-center justify-between">
        <div />
        <span className="text-sm muted-text">Calendar</span>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Calendar & Schedule</h1>
            <p className="muted-text text-sm">Live clock, deadlines and pricing review tasks</p>
          </div>
          <button
            onClick={exportICS}
            disabled={openTasks.length === 0}
            className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-40"
          >
            📅 Export .ics
          </button>
        </div>

        {/* Live digital clock */}
        <div className="glass-card p-6 mb-6 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="mono tabular-nums gradient-heading text-5xl font-bold tracking-tight">
                {time}
              </span>
              {suffix && <span className="mono text-xl accent-text font-semibold">{suffix}</span>}
            </div>
            <p className="text-sm muted-text mt-2 flex items-center gap-2">
              <span className="status-dot" />
              {now.toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
              <span className="muted-text-2 text-xs">· {timeZone}</span>
            </p>
            <button
              onClick={() => setHour12(!hour12)}
              className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] muted-text hover:text-white transition"
            >
              Switch to {hour12 ? "24-hour" : "12-hour"}
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="terminal-card px-4 py-3 min-w-[110px]">
              <p className="text-[10px] muted-text-2 uppercase tracking-wide mb-1">Day</p>
              <p className="mono font-bold">{now.toLocaleDateString("en-US", { weekday: "long" })}</p>
            </div>
            <div className="terminal-card px-4 py-3 min-w-[80px]">
              <p className="text-[10px] muted-text-2 uppercase tracking-wide mb-1">Date</p>
              <p className="mono accent-text font-bold">{now.getDate()}</p>
            </div>
            <div className="terminal-card px-4 py-3 min-w-[110px]">
              <p className="text-[10px] muted-text-2 uppercase tracking-wide mb-1">Month</p>
              <p className="mono violet-text font-bold">{MONTHS[now.getMonth()]}</p>
            </div>
            <div className="terminal-card px-4 py-3 min-w-[80px]">
              <p className="text-[10px] muted-text-2 uppercase tracking-wide mb-1">Year</p>
              <p className="mono font-bold">{now.getFullYear()}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Month grid */}
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {MONTHS[viewMonth]} {viewYear}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] muted-text hover:text-white transition"
                >
                  ‹ Prev
                </button>
                <button
                  onClick={goToday}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] muted-text hover:text-white transition"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] muted-text hover:text-white transition"
                >
                  Next ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] muted-text-2 uppercase py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`blank-${i}`} />;
                const key = toKey(viewYear, viewMonth, day);
                const isToday = key === todayKey;
                const isSelected = key === selected;
                const info = countByDate[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center gap-1 border transition ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                        : isToday
                        ? "border-[var(--border-strong)]"
                        : "border-transparent hover:bg-white/5"
                    }`}
                  >
                    <span className={`mono ${isToday ? "accent-text font-bold" : ""}`}>{day}</span>
                    {info && (
                      <span className="flex gap-0.5">
                        {Array.from({ length: Math.min(info.total, 3) }).map((_, n) => (
                          <span
                            key={n}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: info.open > 0 ? "var(--accent)" : "var(--muted-2)" }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-1">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h2>
              <p className="text-xs muted-text-2 mb-4">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}
              </p>

              <form onSubmit={addTask} className="space-y-2 mb-4">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Add a task or deadline"
                  className="input-field w-full px-3 py-2 rounded-lg text-sm text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input-field flex-1 px-3 py-2 rounded-lg text-sm text-white"
                  />
                  <button type="submit" className="accent-btn text-xs px-4 py-2 rounded-lg font-semibold">
                    Add
                  </button>
                </div>
              </form>

              {selectedTasks.length === 0 ? (
                <p className="muted-text text-sm">Nothing scheduled for this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedTasks.map((t) => (
                    <div key={t.id} className="terminal-card px-3 py-2.5 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleTask(t.id)}
                        className="accent-[var(--accent)]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${t.done ? "line-through muted-text-2" : ""}`}>
                          {t.title}
                        </p>
                        {t.time && <p className="mono text-[11px] muted-text-2">{t.time}</p>}
                      </div>
                      <button
                        onClick={() => deleteTask(t.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
              {overdueCount > 0 && (
                <p className="text-xs text-red-400 mb-3">
                  {overdueCount} overdue task{overdueCount !== 1 ? "s" : ""}
                </p>
              )}
              {upcoming.length === 0 ? (
                <p className="muted-text text-sm">No upcoming tasks.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        const d = new Date(`${t.date}T00:00:00`);
                        setViewYear(d.getFullYear());
                        setViewMonth(d.getMonth());
                        setSelected(t.date);
                      }}
                      className="w-full text-left terminal-card px-3 py-2.5"
                    >
                      <p className="text-sm">{t.title}</p>
                      <p className="mono text-[11px] muted-text-2">
                        {t.date}{t.time ? ` · ${t.time}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}