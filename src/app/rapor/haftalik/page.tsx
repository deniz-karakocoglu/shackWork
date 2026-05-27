"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Plan = {
  weekStart: string;
  weekEnd: string;
  workoutPlan: string;
  mealPlan: string;
} | null;

export default function WeeklyReportPage() {
  const [plan, setPlan] = useState<Plan>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pdfError, setPdfError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setPdfError(null);
    setLoading(true);
    const res = await fetch("/api/plans/weekly", { cache: "no-store" });
    if (res.status === 401) {
      setError("Önce giriş yapın; ardından ana panelden oturum açın.");
      setPlan(null);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Plan yüklenemedi.");
      setPlan(null);
      setLoading(false);
      return;
    }
    const data = await res.json();
    if (!data.plan) {
      setError("Henüz haftalık plan yok. Ana panelden hedef ekleyip «AI ile program oluştur»a basın.");
      setPlan(null);
      setLoading(false);
      return;
    }
    setPlan(data.plan);
    setLoading(false);
  }, []);

  const downloadWeeklyPdf = useCallback(async () => {
    setPdfError(null);
    try {
      const res = await fetch("/api/plans/weekly/pdf", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setPdfError(j.error ?? `PDF indirilemedi (${res.status}).`);
        return;
      }
      if (!ct.includes("pdf")) {
        setPdfError("Sunucu PDF döndürmedi; oturum açmanız gerekebilir.");
        return;
      }
      const blob = await res.blob();
      const dispo = res.headers.get("Content-Disposition") ?? "";
      const m = /filename="([^"]+)"/.exec(dispo);
      const fn = m?.[1] ?? "shackwork-haftalik.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fn;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError("PDF indirilemedi.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 print:bg-white">
      <header className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold">shackWork — haftalık rapor</h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void downloadWeeklyPdf()}
            className="rounded-lg border border-amber-600 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
          >
            PDF indir
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
          >
            Yazdır
          </button>
          <Link href="/" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm">
            Panele dön
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {pdfError && <p className="text-sm text-red-600">{pdfError}</p>}
        {loading && <p className="text-sm text-zinc-600">Plan yenileniyor…</p>}
        {!loading && !plan && !error && (
          <p className="text-sm text-zinc-600">
            Bu hafta için plan kaydı oluşmadı. Ana panelden giriş yapıp tekrar deneyin.
          </p>
        )}
        {plan && (
          <>
            <p className="text-sm text-zinc-600">
              Hafta: <strong>{plan.weekStart}</strong> — <strong>{plan.weekEnd}</strong>
            </p>
            <section>
              <h2 className="text-base font-semibold text-zinc-800">Antrenman</h2>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed">
                {plan.workoutPlan}
              </pre>
            </section>
            <section>
              <h2 className="text-base font-semibold text-zinc-800">Beslenme</h2>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed">
                {plan.mealPlan}
              </pre>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
