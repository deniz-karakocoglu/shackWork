"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ClientRow = {
  id: string;
  email: string;
  name: string | null;
  goalFocus: string;
  createdAt: string;
  coach: { id: string; name: string } | null;
  _count: { metrics: number; dayLogs: number; goals: number; photos: number };
  metrics: { measuredAt: string; weightKg: number; bodyFatPercent: number | null }[];
  dayLogs: { logDate: string }[];
};

export default function CoachPage() {
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyPriority, setOnlyPriority] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/coach/clients");
    if (res.status === 403) {
      setError("Bu sayfa sadece koç hesapları içindir.");
      setClients([]);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Liste yüklenemedi. Giriş yaptığınızdan emin olun.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function diffDaysFromToday(isoLike: string): number {
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return 999;
    const now = new Date();
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const utcD = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.floor((utcNow - utcD) / (1000 * 60 * 60 * 24));
  }

  function getPriority(c: ClientRow): "high" | "normal" {
    const lastLog = c.dayLogs[0]?.logDate;
    const lastMetric = c.metrics[0]?.measuredAt;
    const staleLog = !lastLog || diffDaysFromToday(lastLog) >= 4;
    const staleMetric = !lastMetric || diffDaysFromToday(lastMetric) >= 8;
    return staleLog || staleMetric ? "high" : "normal";
  }

  const visibleClients = clients.filter((c) =>
    onlyPriority ? getPriority(c) === "high" : true,
  );

  return (
    <div className="min-h-dvh bg-transparent text-zinc-100">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-emerald-400">shackWork</p>
          <h1 className="text-xl font-semibold">Koç paneli</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/koclar" className="text-emerald-300 hover:underline">
            Koçlar
          </Link>
          <Link href="/" className="text-emerald-300 hover:underline">
            Panele dön
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-3 flex items-center justify-end">
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={onlyPriority}
              onChange={(e) => setOnlyPriority(e.target.checked)}
            />
            Sadece oncelikli kullanicilar (uzun suredir kayit girmeyen)
          </label>
        </div>
        {loading && <p className="text-zinc-500">Yükleniyor…</p>}
        {error && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-zinc-400">
                <tr>
                  <th className="px-3 py-2">İsim / e-posta</th>
                  <th className="px-3 py-2">Odak</th>
                  <th className="px-3 py-2">Oncelik</th>
                  <th className="px-3 py-2">Atanan koç</th>
                  <th className="px-3 py-2">Ölçüm</th>
                  <th className="px-3 py-2">Günlük</th>
                  <th className="px-3 py-2">Sayılar</th>
                  <th className="px-3 py-2">Detay</th>
                </tr>
              </thead>
              <tbody>
                {visibleClients.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2">
                      <div className="font-medium text-white">{c.name ?? "—"}</div>
                      <div className="text-xs text-zinc-500">{c.email}</div>
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{c.goalFocus}</td>
                    <td className="px-3 py-2">
                      {getPriority(c) === "high" ? (
                        <span className="rounded bg-rose-950/50 px-2 py-0.5 text-[10px] text-rose-200">
                          ONCELIKLI
                        </span>
                      ) : (
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{c.coach?.name ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-400">
                      {c.metrics[0]
                        ? `${c.metrics[0].weightKg} kg · ${new Date(c.metrics[0].measuredAt).toLocaleDateString("tr-TR")}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {c.dayLogs[0]?.logDate ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      ölçüm {c._count.metrics} · günlük {c._count.dayLogs} · hedef{" "}
                      {c._count.goals} · foto {c._count.photos}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/coach/${c.id}`}
                        className="text-emerald-300 text-sm hover:underline"
                      >
                        Aç
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleClients.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-500">Henüz kayıtlı kullanıcı yok.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
