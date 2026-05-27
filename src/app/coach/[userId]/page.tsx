"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ClientDetail = {
  id: string;
  email: string;
  name: string | null;
  heightCm: number | null;
  goalFocus: string;
  createdAt: string;
  coach: { id: string; name: string; title: string | null } | null;
  metrics: { id: string; measuredAt: string; weightKg: number; bodyFatPercent: number | null }[];
  dayLogs: {
    logDate: string;
    trainingText: string | null;
    mealsText: string | null;
    notes: string | null;
    aiReport: string | null;
  }[];
  goals: {
    id: string;
    title: string;
    description: string | null;
    startDate: string;
    targetDate: string;
    durationMonths: number | null;
  }[];
  photos: { id: string; takenAt: string; imageUrl: string; note: string | null }[];
};

export default function CoachClientDetailPage() {
  const params = useParams();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [coachComment, setCoachComment] = useState<string>("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notesBusy, setNotesBusy] = useState(false);
  const [notes, setNotes] = useState<
    Array<{ id: string; content: string; createdAt: string; author: { name: string | null; email: string } }>
  >([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    const res = await fetch(`/api/coach/clients/${userId}`);
    if (res.status === 403) {
      setError("Bu sayfa yalnızca koç hesapları içindir.");
      return;
    }
    if (!res.ok) {
      setError("Veri yüklenemedi.");
      return;
    }
    const data = await res.json();
    setClient(data.client ?? null);
    const notesRes = await fetch(`/api/coach/clients/${userId}/notes`);
    if (notesRes.ok) {
      const notesData = await notesRes.json();
      setNotes(notesData.notes ?? []);
    }
  }, [userId]);

  const downloadClientPdf = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      const res = await fetch(`/api/coach/clients/${userId}/export`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `PDF indirilemedi (${res.status}).`);
        return;
      }
      if (!ct.includes("pdf")) {
        setError("Sunucu PDF döndürmedi.");
        return;
      }
      const blob = await res.blob();
      const dispo = res.headers.get("Content-Disposition") ?? "";
      const m = /filename="([^"]+)"/.exec(dispo);
      const fn = m?.[1] ?? "shackwork-client.pdf";
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
      setError("PDF indirilemedi.");
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function generateWeeklyComment() {
    if (!userId) return;
    setCommentBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/coach/clients/${userId}/weekly-comment`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Yorum üretilemedi.");
        return;
      }
      setCoachComment(typeof data.comment === "string" ? data.comment : "");
    } finally {
      setCommentBusy(false);
    }
  }

  async function saveCoachNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNotesBusy(true);
    try {
      const res = await fetch(`/api/coach/clients/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Not kaydedilemedi.");
        return;
      }
      setNoteText("");
      await load();
    } finally {
      setNotesBusy(false);
    }
  }

  async function startEditNote(id: string, content: string) {
    setEditingNoteId(id);
    setEditingContent(content);
  }

  async function saveEditNote() {
    if (!editingNoteId) return;
    const content = editingContent.trim();
    if (!content) return;
    setNotesBusy(true);
    try {
      const res = await fetch(`/api/coach/clients/${userId}/notes/${editingNoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Not guncellenemedi.");
        return;
      }
      setEditingNoteId(null);
      setEditingContent("");
      await load();
    } finally {
      setNotesBusy(false);
    }
  }

  async function deleteNote(noteId: string) {
    if (!confirm("Bu not silinsin mi?")) return;
    setNotesBusy(true);
    try {
      const res = await fetch(`/api/coach/clients/${userId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Not silinemedi.");
        return;
      }
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setEditingContent("");
      }
      await load();
    } finally {
      setNotesBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-transparent text-zinc-100">
      <header className="border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-emerald-400">shackWork</p>
          <h1 className="text-xl font-semibold">Müşteri detayı</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void downloadClientPdf()}
            className="text-sm rounded border border-white/20 px-3 py-1.5 text-zinc-200 hover:bg-white/5"
          >
            PDF indir
          </button>
          <Link href="/koclar" className="text-sm text-emerald-300 hover:underline">
            Koçlar
          </Link>
          <Link href="/coach" className="text-sm text-emerald-300 hover:underline">
            Listeye dön
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-8 p-6">
        {error && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}
        {client && (
          <>
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold text-white">Profil</h2>
              <p className="mt-2 text-sm text-zinc-300">
                {client.name ?? "—"} · <span className="text-zinc-500">{client.email}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Boy: {client.heightCm ?? "—"} cm · Odak: {client.goalFocus} · Atanan koç:{" "}
                {client.coach?.name ?? "—"}
              </p>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold text-white">Hedefler</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {client.goals.length === 0 && (
                  <li className="text-zinc-500">Hedef yok.</li>
                )}
                {client.goals.map((g) => (
                  <li key={g.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <span className="font-medium text-zinc-200">{g.title}</span>
                    <span className="ml-2 text-xs text-zinc-500">
                      bitiş {new Date(g.targetDate).toLocaleDateString("tr-TR")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold text-white">Son ölçümler</h2>
              <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-zinc-400">
                {client.metrics.map((m) => (
                  <li key={m.id} className="border-b border-white/5 py-1">
                    {new Date(m.measuredAt).toLocaleString("tr-TR")} — {m.weightKg} kg
                    {m.bodyFatPercent != null ? ` · %${m.bodyFatPercent}` : ""}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold text-white">Günlükler</h2>
              <ul className="mt-2 space-y-3 text-sm">
                {client.dayLogs.map((d) => (
                  <li key={d.logDate} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-xs font-medium text-emerald-300">{d.logDate}</p>
                    {d.trainingText?.trim() && (
                      <p className="mt-1 text-xs text-zinc-400">Antrenman: {d.trainingText}</p>
                    )}
                    {d.mealsText?.trim() && (
                      <p className="mt-1 text-xs text-zinc-400">Beslenme: {d.mealsText}</p>
                    )}
                    {d.aiReport?.trim() && (
                      <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-emerald-950/20 p-2 text-xs text-zinc-300">
                        {d.aiReport}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">Haftalık koç yorumu</h2>
                <button
                  type="button"
                  onClick={generateWeeklyComment}
                  disabled={commentBusy}
                  className="rounded border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-50"
                >
                  {commentBusy ? "Uretiliyor..." : "AI yorum uret"}
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Gemini tanimliysa model tabanli, degilse kural tabanli not gelir.
              </p>
              {coachComment && (
                <pre className="mt-3 whitespace-pre-wrap rounded bg-emerald-950/20 p-3 text-xs text-zinc-200">
                  {coachComment}
                </pre>
              )}
              <form onSubmit={saveCoachNote} className="mt-4 grid gap-2">
                <label className="text-xs text-zinc-400">Koç notu ekle</label>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="rounded border border-white/15 bg-black/40 px-3 py-2 text-xs text-zinc-200"
                  placeholder="Bu haftaki gozlem ve aksiyon notu..."
                />
                <button
                  type="submit"
                  disabled={notesBusy}
                  className="justify-self-start rounded border border-violet-500/40 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-950/30 disabled:opacity-50"
                >
                  {notesBusy ? "Kaydediliyor..." : "Notu kaydet"}
                </button>
              </form>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-zinc-300">Not gecmisi</p>
                {notes.length === 0 && (
                  <p className="text-xs text-zinc-500">Henuz kayitli not yok.</p>
                )}
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded border border-white/10 bg-black/30 px-3 py-2"
                  >
                    {editingNoteId === n.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEditNote}
                            disabled={notesBusy}
                            className="rounded border border-emerald-500/40 px-2 py-1 text-[10px] text-emerald-200"
                          >
                            Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingContent("");
                            }}
                            className="rounded border border-white/20 px-2 py-1 text-[10px] text-zinc-300"
                          >
                            Vazgec
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-200 whitespace-pre-wrap">{n.content}</p>
                    )}
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {new Date(n.createdAt).toLocaleString("tr-TR")} ·{" "}
                      {n.author.name ?? n.author.email}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditNote(n.id, n.content)}
                        className="text-[10px] text-emerald-300 hover:underline"
                      >
                        Duzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(n.id)}
                        className="text-[10px] text-red-300 hover:underline"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-sm font-semibold text-white">Fotoğraflar</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {client.photos.map((p) => (
                  <figure key={p.id} className="overflow-hidden rounded-lg border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" />
                    <figcaption className="px-1 py-0.5 text-[10px] text-zinc-500">
                      {new Date(p.takenAt).toLocaleDateString("tr-TR")}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
