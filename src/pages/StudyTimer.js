import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Play, Pause, RotateCcw, Flag, Download, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
  return `${h}:${m}:${s}.${cs}`;
}

function toDateKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helpers for week/month calculations
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // make Monday first
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysInMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function BarChart({ dataMap, days = 7 }) {
  const width = 420, height = 140, pad = 24;
  const keys = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return toDateKey(d);
  });
  const values = keys.map(k => (dataMap[k] || 0) / 3600000); // ms -> hours
  const max = Math.max(1, ...values);
  const bw = (width - 2 * pad) / days - 6;

  return (
    <svg width={width} height={height} className="w-full h-auto">
      {/* grid */}
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={pad} x2={width - pad} y1={pad + t * (height - 2 * pad)} y2={pad + t * (height - 2 * pad)} stroke="#9ca3af33" />
      ))}
      {values.map((v, i) => {
        const x = pad + i * ((width - 2 * pad) / days);
        const h = ((v / max) * (height - 2 * pad));
        const y = height - pad - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx={6} fill="#3b82f6" opacity="0.8" />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="10" fill="#6b7280">{v.toFixed(1)} saat</text>
            <text x={x + bw / 2} y={height - pad + 12} textAnchor="middle" fontSize="10" fill="#6b7280">{keys[i].slice(5)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function StudyTimer() {
  // Local store structure
  const [store, setStore] = useLocalStorage('studyTimer', {
    sessions: [], // {id, start, end, duration}
    laps: [], // {id, time, total, createdAt}
    running: false,       // persist running state
    startedAt: null,      // epoch ms when started
    accumulated: 0,       // carried elapsed when paused
    lapBase: 0,           // base ms for current lap
  });

  // Normalize to protect against old/local corrupted data shapes
  const sessions = Array.isArray(store?.sessions) ? store.sessions : [];
  const laps = Array.isArray(store?.laps) ? store.laps : [];

  const [running, setRunning] = useState(!!store.running);
  const [startAt, setStartAt] = useState(store.startedAt || null);
  const [elapsed, setElapsed] = useState(0); // current session elapsed ms
  const [accumulated, setAccumulated] = useState(store.accumulated || 0); // paused elapsed carry
  const [lapBase, setLapBase] = useState(store.lapBase || 0); // time of last lap (ms)

  const tickRef = useRef(null);

  useEffect(() => {
    if (running) {
      tickRef.current = setInterval(() => {
        setElapsed(Date.now() - startAt + accumulated);
      }, 50);
      return () => clearInterval(tickRef.current);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
  }, [running, startAt, accumulated]);

  // On mount, recompute elapsed from persisted timestamps
  useEffect(() => {
    if (store.running && store.startedAt) {
      setElapsed(Date.now() - store.startedAt + (store.accumulated || 0));
    } else {
      setElapsed(store.accumulated || 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    if (running) return;
    const now = Date.now();
    setStartAt(now);
    setRunning(true);
    setStore({
      ...store,
      running: true,
      startedAt: now,
      accumulated,
      lapBase,
    });
  };

  const pause = () => {
    if (!running) return;
    const now = Date.now();
    const total = now - startAt + accumulated;
    setRunning(false);
    setAccumulated(total);
    setElapsed(total);
    setStore({
      ...store,
      running: false,
      startedAt: null,
      accumulated: total,
      lapBase,
    });
  };

  const reset = () => {
    setRunning(false);
    setStartAt(null);
    setElapsed(0);
    setAccumulated(0);
    setLapBase(0);
    // Sadece zamanlayıcı durumunu sıfırla; geçmişi koru
    setStore({
      ...store,
      sessions,
      laps,
      running: false,
      startedAt: null,
      accumulated: 0,
      lapBase: 0,
    });
  };

  const lap = () => {
    const total = elapsed;
    const lastTotal = laps.length ? laps[laps.length - 1].total : 0;
    const lapDur = Math.max(0, total - lastTotal);
    const entry = { id: Date.now(), time: lapDur, total, createdAt: Date.now() };
    setStore({
      ...store,
      sessions,
      laps: [...laps, entry],
      running,
      startedAt: startAt,
      accumulated,
      lapBase: total,
    });
    // Reset small lap timer to zero by moving the base
    setLapBase(total);
  };

  const saveSession = () => {
    if (elapsed <= 0) return;
    const now = Date.now();
    const session = { id: now, start: startAt ?? now - elapsed, end: now, duration: elapsed };
    // 1) Persist new session and clear timer flags in store
    setStore({
      sessions: [...sessions, session],
      laps,
      running: false,
      startedAt: null,
      accumulated: 0,
      lapBase: 0,
    });
    // 2) Locally reset timer state without touching store again
    setRunning(false);
    setStartAt(null);
    setElapsed(0);
    setAccumulated(0);
    setLapBase(0);
  };

  const clearHistory = () => setStore({ sessions: [], laps: [], running: false, startedAt: null, accumulated: 0, lapBase: 0 });

  const exportCSV = () => {
    const rows = [
      ['#', 'Süre', 'Başlangıç', 'Bitiş', 'Tarih'],
      ...sessions.map((s, i) => [
        i + 1,
        formatMs(s.duration),
        new Date(s.start).toLocaleTimeString(),
        new Date(s.end).toLocaleTimeString(),
        new Date(s.end).toLocaleDateString(),
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-sessions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Daily aggregation
  const dailyMap = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      const k = toDateKey(s.end);
      map[k] = (map[k] || 0) + s.duration;
    }
    return map;
  }, [sessions]);

  // Current lap timer value (since last lap)
  const currentLapElapsed = Math.max(0, elapsed - lapBase);

  // Aggregates: today, this week, this month totals and averages
  const now = new Date();
  const todayKey = toDateKey(now);
  const todayTotal = dailyMap[todayKey] || 0;

  const weekStart = startOfWeek(now);
  const weekKeys = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return toDateKey(d);
  });
  const weekTotal = weekKeys.reduce((sum, k) => sum + (dailyMap[k] || 0), 0);
  const weekAvg = weekTotal / 7;

  const curYear = now.getFullYear();
  const curMonth0 = now.getMonth();
  const curMonthDays = daysInMonth(curYear, curMonth0);
  const monthKeys = Array.from({ length: curMonthDays }).map((_, i) => `${curYear}-${String(curMonth0 + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
  const monthTotal = monthKeys.reduce((sum, k) => sum + (dailyMap[k] || 0), 0);
  const monthAvg = monthTotal / curMonthDays;

  // Month browser state
  const [browseYear, setBrowseYear] = useState(curYear);
  const [browseMonth0, setBrowseMonth0] = useState(curMonth0);
  const [selectedDay, setSelectedDay] = useState(null); // 1..N or null

  const browseDays = daysInMonth(browseYear, browseMonth0);
  const browseMonthLabel = `${String(browseMonth0 + 1).padStart(2, '0')}/${browseYear}`;
  const browseKeys = Array.from({ length: browseDays }).map((_, i) => `${browseYear}-${String(browseMonth0 + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
  const browseTotals = browseKeys.map(k => (dailyMap[k] || 0));
  const selectedKey = selectedDay ? `${browseYear}-${String(browseMonth0 + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` : null;
  const selectedTotal = selectedKey ? (dailyMap[selectedKey] || 0) : 0;

  const moveMonth = (delta) => {
    const d = new Date(browseYear, browseMonth0, 1);
    d.setMonth(d.getMonth() + delta);
    setBrowseYear(d.getFullYear());
    setBrowseMonth0(d.getMonth());
    setSelectedDay(null);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zamanlayıcı</h1>
          <p className="text-gray-600 dark:text-gray-400">Çalışma süreni tut, gün bazında toplamları gör ve dışa aktar</p>
        </div>
      </div>

      {/* Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-6xl md:text-8xl font-bold tracking-wider text-gray-900 dark:text-white tabular-nums">
          {formatMs(elapsed)}
        </div>
        <div className="mt-2 text-emerald-500">{formatMs(currentLapElapsed)}</div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {!running ? (
            <button onClick={start} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              <Play className="w-4 h-4" /> Başlat
            </button>
          ) : (
            <button onClick={pause} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white">
              <Pause className="w-4 h-4" /> Duraklat
            </button>
          )}

          <button onClick={lap} disabled={!running && elapsed === 0} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white">
            <Flag className="w-4 h-4" /> Tur
          </button>

          <button onClick={reset} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-400 hover:bg-rose-500 text-white">
            <RotateCcw className="w-4 h-4" /> Sıfırla
          </button>

          <button onClick={saveSession} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
            <Clock className="w-4 h-4" /> Kaydet (Oturum)
          </button>
        </div>
      </div>

      {/* Laps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Kronometre Geçmişi</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Tur Süresi</th>
                <th className="px-3 py-2 text-left">Geçen Süre</th>
                <th className="px-3 py-2 text-left">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {laps.map((l, i) => (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">{formatMs(l.time)}</td>
                  <td className="px-3 py-2">{formatMs(l.total)}</td>
                  <td className="px-3 py-2">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {laps.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">Henüz tur yok</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            <Download className="w-4 h-4" /> CSV'ye Aktar
          </button>
          <button onClick={clearHistory} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
            <Trash2 className="w-4 h-4" /> Temizle
          </button>
        </div>
      </div>

      {/* Aggregates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Özet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/40">
            <div className="text-sm text-gray-500 dark:text-gray-400">Bugün</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{(todayTotal/3600000).toFixed(2)} saat</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/40">
            <div className="text-sm text-gray-500 dark:text-gray-400">Bu Hafta (Toplam / Ortalama)</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{(weekTotal/3600000).toFixed(2)} / {(weekAvg/3600000).toFixed(2)} saat</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/40">
            <div className="text-sm text-gray-500 dark:text-gray-400">Bu Ay (Toplam / Ortalama)</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">{(monthTotal/3600000).toFixed(2)} / {(monthAvg/3600000).toFixed(2)} saat</div>
          </div>
        </div>
      </div>

      {/* Daily summary chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Son 7 Gün (saat)</h2>
        <BarChart dataMap={dailyMap} days={7} />
      </div>

      {/* Month browser */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aylık Görünüm</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => moveMonth(-1)} className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600">Önceki</button>
            <div className="text-gray-700 dark:text-gray-200 w-28 text-center">{browseMonthLabel}</div>
            <button onClick={() => moveMonth(1)} className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600">Sonraki</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: browseDays }).map((_, i) => {
            const day = i + 1;
            const key = `${browseYear}-${String(browseMonth0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hours = (dailyMap[key] || 0) / 3600000;
            const active = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`p-2 rounded-lg border text-left ${active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'} hover:bg-gray-50 dark:hover:bg-gray-700/40`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400">{String(day).padStart(2, '0')}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{hours.toFixed(2)}s</div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-gray-800 dark:text-gray-200">
          {selectedDay ? (
            <div>
              <div className="font-semibold mb-1">Seçili Gün: {String(selectedDay).padStart(2, '0')}/{String(browseMonth0 + 1).padStart(2, '0')}/{browseYear}</div>
              <div>Toplam: {(selectedTotal/3600000).toFixed(2)} saat</div>
            </div>
          ) : (
            <div>Gün seçerek toplamı görebilirsiniz.</div>
          )}
        </div>
      </div>
    </div>
  );
}
