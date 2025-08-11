import React, { useMemo, useState } from 'react';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Helpers
const movingAverage = (arr, windowSize) => {
  const n = arr.length;
  if (!n) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = arr.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    out.push(avg);
  }
  return out;
};

const linearTrend = (arr) => {
  const n = arr.length;
  if (n === 0) return [];
  const xs = Array.from({ length: n }, (_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = arr.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * arr[i], 0);
  const sumXX = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumXX - sumX * sumX || 1;
  const b = (n * sumXY - sumX * sumY) / denom; // slope
  const a = (sumY - b * sumX) / n; // intercept
  return xs.map((x) => a + b * x);
};

// Lightweight sparkline/line chart using pure SVG (no external deps)
function LineChart({ data, height = 140, color = '#3b82f6', label, showMA5, showMA10, showTrend }) {
  const width = 360;
  const padding = 24; // left/right padding for labels
  const values = data && data.length ? data : [0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padding + (i * (width - 2 * padding)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((v - min) * (height - 2 * padding)) / range;
    return `${x},${y}`;
  }).join(' ');

  const last = values[values.length - 1] ?? 0;
  const lastX = padding + ((values.length - 1) * (width - 2 * padding)) / Math.max(values.length - 1, 1);
  const lastY = height - padding - ((last - min) * (height - 2 * padding)) / range;

  // Optional overlays
  const ma5Vals = showMA5 ? movingAverage(values, 5) : null;
  const ma10Vals = showMA10 ? movingAverage(values, 10) : null;
  const trendVals = showTrend ? linearTrend(values) : null;

  const toPolyline = (arr) => arr.map((v, i) => {
    const x = padding + (i * (width - 2 * padding)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((v - min) * (height - 2 * padding)) / range;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Son: {last}</span>
      </div>
      <svg width={width} height={height} className="w-full h-auto">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padding} x2={width - padding} y1={padding + t * (height - 2 * padding)} y2={padding + t * (height - 2 * padding)} stroke="#9ca3af33" />
        ))}
        {/* Area fill */}
        <polyline points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`} fill={`url(#grad-${label})`} stroke="none" />
        {/* Line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* MA5 */}
        {ma5Vals && (
          <polyline points={toPolyline(ma5Vals)} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
        )}
        {/* MA10 */}
        {ma10Vals && (
          <polyline points={toPolyline(ma10Vals)} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 3" />
        )}
        {/* Trend */}
        {trendVals && (
          <polyline points={toPolyline(trendVals)} fill="none" stroke="#94a3b8" strokeWidth="1.25" />
        )}
        {/* Last point */}
        <circle cx={lastX} cy={lastY} r="3.5" fill={color} />
      </svg>
    </div>
  );
}

export default function ExamTracker() {
  const [store, setStore] = useLocalStorage('examTracker', {
    activeType: 'TYT',
    aytBranch: 'Sayısal',
    tyt: [],
    ayt: [],
  });

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: '',
    notes: '',
    // TYT
    tyt: { turkce: '', sosyal: '', matematik: '', fen: '' },
    // AYT (Sayısal varsayılan)
    ayt: { mat: '', fiz: '', kim: '', bio: '' },
  });

  const isTYT = store.activeType === 'TYT';

  const tytTotal = useMemo(() => {
    const { turkce, sosyal, matematik, fen } = form.tyt;
    const vals = [turkce, sosyal, matematik, fen].map((v) => Number(v || 0));
    return vals.reduce((a, b) => a + b, 0);
  }, [form.tyt]);

  const aytTotal = useMemo(() => {
    const { mat, fiz, kim, bio } = form.ayt;
    const vals = [mat, fiz, kim, bio].map((v) => Number(v || 0));
    return vals.reduce((a, b) => a + b, 0);
  }, [form.ayt]);

  const addExam = () => {
    if (!form.name.trim()) return;
    if (!form.date) return;

    if (isTYT) {
      const row = {
        id: Date.now(),
        date: form.date,
        name: form.name.trim(),
        notes: form.notes.trim(),
        turkce: Number(form.tyt.turkce || 0),
        sosyal: Number(form.tyt.sosyal || 0),
        matematik: Number(form.tyt.matematik || 0),
        fen: Number(form.tyt.fen || 0),
        total: tytTotal,
      };
      setStore({ ...store, tyt: [...store.tyt, row] });
    } else {
      const row = {
        id: Date.now(),
        date: form.date,
        name: form.name.trim(),
        notes: form.notes.trim(),
        branch: store.aytBranch,
        mat: Number(form.ayt.mat || 0),
        fiz: Number(form.ayt.fiz || 0),
        kim: Number(form.ayt.kim || 0),
        bio: Number(form.ayt.bio || 0),
        total: aytTotal,
      };
      setStore({ ...store, ayt: [...store.ayt, row] });
    }

    setForm({
      date: new Date().toISOString().slice(0, 10),
      name: '',
      notes: '',
      tyt: { turkce: '', sosyal: '', matematik: '', fen: '' },
      ayt: { mat: '', fiz: '', kim: '', bio: '' },
    });
  };

  const removeExam = (id) => {
    if (isTYT) {
      setStore({ ...store, tyt: store.tyt.filter((r) => r.id !== id) });
    } else {
      setStore({ ...store, ayt: store.ayt.filter((r) => r.id !== id) });
    }
  };

  const sortedRows = useMemo(() => {
    const rows = isTYT ? store.tyt : store.ayt;
    return [...rows].sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [store, isTYT]);

  // Charts data
  const tytTotals = useMemo(() => store.tyt.map((r) => r.total), [store.tyt]);
  const tytTurkce = useMemo(() => store.tyt.map((r) => r.turkce), [store.tyt]);
  const tytSosyal = useMemo(() => store.tyt.map((r) => r.sosyal), [store.tyt]);
  const tytMat = useMemo(() => store.tyt.map((r) => r.matematik), [store.tyt]);
  const tytFen = useMemo(() => store.tyt.map((r) => r.fen), [store.tyt]);

  const aytTotals = useMemo(() => store.ayt.map((r) => r.total), [store.ayt]);
  const aytMat = useMemo(() => store.ayt.map((r) => r.mat), [store.ayt]);
  const aytFiz = useMemo(() => store.ayt.map((r) => r.fiz), [store.ayt]);
  const aytKim = useMemo(() => store.ayt.map((r) => r.kim), [store.ayt]);
  const aytBio = useMemo(() => store.ayt.map((r) => r.bio), [store.ayt]);

  // Chart toggles
  const [showMA5, setShowMA5] = useState(true);
  const [showMA10, setShowMA10] = useState(false);
  const [showTrend, setShowTrend] = useState(true);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deneme Takip</h1>
          <p className="text-gray-600 dark:text-gray-400">TYT ve AYT denemelerinizi kaydedin, tablo ve grafiklerle ilerlemenizi görün</p>
        </div>
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setStore({ ...store, activeType: 'TYT' })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${store.activeType === 'TYT' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}
          >
            TYT
          </button>
          <button
            onClick={() => setStore({ ...store, activeType: 'AYT' })}
            className={`px-4 py-2 rounded-md text-sm font-medium ${store.activeType === 'AYT' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}
          >
            AYT
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tarih</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Sınav Adı</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Örn: Limit 1" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>

          {!isTYT && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">AYT Alanı</label>
              <select value={store.aytBranch} onChange={(e) => setStore({ ...store, aytBranch: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                <option>Sayısal</option>
                <option>Eşit Ağırlık</option>
                <option>Sözel</option>
                <option>Dil</option>
              </select>
            </div>
          )}

          <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-5 gap-3">
            {isTYT ? (
              <>
                <NumberField label="Türkçe" max={40} value={form.tyt.turkce} onChange={(v) => setForm({ ...form, tyt: { ...form.tyt, turkce: v } })} />
                <NumberField label="Sosyal" max={20} value={form.tyt.sosyal} onChange={(v) => setForm({ ...form, tyt: { ...form.tyt, sosyal: v } })} />
                <NumberField label="Matematik" max={40} value={form.tyt.matematik} onChange={(v) => setForm({ ...form, tyt: { ...form.tyt, matematik: v } })} />
                <NumberField label="Fen" max={20} value={form.tyt.fen} onChange={(v) => setForm({ ...form, tyt: { ...form.tyt, fen: v } })} />
                <ReadOnlyField label="Toplam" value={tytTotal} />
              </>
            ) : (
              <>
                <NumberField label="Matematik" max={40} value={form.ayt.mat} onChange={(v) => setForm({ ...form, ayt: { ...form.ayt, mat: v } })} />
                <NumberField label="Fizik" max={14} value={form.ayt.fiz} onChange={(v) => setForm({ ...form, ayt: { ...form.ayt, fiz: v } })} />
                <NumberField label="Kimya" max={13} value={form.ayt.kim} onChange={(v) => setForm({ ...form, ayt: { ...form.ayt, kim: v } })} />
                <NumberField label="Biyoloji" max={13} value={form.ayt.bio} onChange={(v) => setForm({ ...form, ayt: { ...form.ayt, bio: v } })} />
                <ReadOnlyField label="Toplam" value={aytTotal} />
              </>
            )}
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs text-gray-500 mb-1">Not</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Örn: Optikte zorlandım" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>

          <div className="md:col-span-5 flex justify-end">
            <button onClick={addExam} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              <Plus className="w-4 h-4" /> Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex items-center gap-4 -mb-2">
        <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showMA5} onChange={(e) => setShowMA5(e.target.checked)} />
            MA(5)
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showMA10} onChange={(e) => setShowMA10(e.target.checked)} />
            MA(10)
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showTrend} onChange={(e) => setShowTrend(e.target.checked)} />
            Trend
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isTYT ? (
          <>
            <LineChart data={tytTotals} label="TYT Genel Toplam (max 120)" color="#0ea5e9" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={tytTurkce} label="TYT Türkçe (max 40)" color="#ef4444" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={tytMat} label="TYT Matematik (max 40)" color="#3b82f6" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={tytSosyal} label="TYT Sosyal (max 20)" color="#f59e0b" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={tytFen} label="TYT Fen (max 20)" color="#10b981" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
          </>
        ) : (
          <>
            <LineChart data={aytTotals} label={`AYT ${store.aytBranch} Toplam (max 80)`} color="#10b981" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={aytMat} label="AYT Matematik (max 40)" color="#3b82f6" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={aytFiz} label="AYT Fizik (max 14)" color="#6366f1" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={aytKim} label="AYT Kimya (max 13)" color="#22c55e" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
            <LineChart data={aytBio} label="AYT Biyoloji (max 13)" color="#e11d48" showMA5={showMA5} showMA10={showMA10} showTrend={showTrend} />
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="px-3 py-2 text-left">Tarih</th>
                <th className="px-3 py-2 text-left">Sınav Adı</th>
                {isTYT ? (
                  <>
                    <th className="px-3 py-2 text-left">Türkçe</th>
                    <th className="px-3 py-2 text-left">Sosyal</th>
                    <th className="px-3 py-2 text-left">Matematik</th>
                    <th className="px-3 py-2 text-left">Fen</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 text-left">Alan</th>
                    <th className="px-3 py-2 text-left">Mat</th>
                    <th className="px-3 py-2 text-left">Fiz</th>
                    <th className="px-3 py-2 text-left">Kim</th>
                    <th className="px-3 py-2 text-left">Bio</th>
                  </>
                )}
                <th className="px-3 py-2 text-left">Toplam</th>
                <th className="px-3 py-2 text-left">Not</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedRows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  {isTYT ? (
                    <>
                      <td className="px-3 py-2">{r.turkce}</td>
                      <td className="px-3 py-2">{r.sosyal}</td>
                      <td className="px-3 py-2">{r.matematik}</td>
                      <td className="px-3 py-2">{r.fen}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">{r.branch}</td>
                      <td className="px-3 py-2">{r.mat}</td>
                      <td className="px-3 py-2">{r.fiz}</td>
                      <td className="px-3 py-2">{r.kim}</td>
                      <td className="px-3 py-2">{r.bio}</td>
                    </>
                  )}
                  <td className="px-3 py-2 font-medium">{r.total}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{r.notes}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => removeExam(r.id)} className="text-red-500 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={isTYT ? 9 : 10} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                    Henüz kayıt yok. Üstteki formdan ekleyin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, max }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}{max ? ` (max ${max})` : ''}</label>
      <input
        type="number"
        step="0.25"
        min={0}
        max={max ?? undefined}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          let num = Number(raw);
          if (Number.isNaN(num)) num = 0;
          if (max != null && num > max) num = max;
          if (num < 0) num = 0;
          onChange(num);
        }}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm">{value}</div>
    </div>
  );
}
