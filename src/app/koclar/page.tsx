"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/branding";

type CoachRow = {
  id: string;
  name: string;
  title: string | null;
  bio: string;
  specialties: string;
  avatarEmoji: string | null;
  photoUrl: string | null;
};

function specialtyTags(raw: string) {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export default function KoclarPage() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/coaches");
        const data = await res.json();
        if (!res.ok) throw new Error("Liste alınamadı.");
        if (!cancelled) setCoaches(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setError("Koç listesi yüklenemedi.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-transparent text-zinc-50">
      <header className="border-b border-emerald-500/20 bg-gradient-to-b from-zinc-950/80 via-zinc-950/55 to-emerald-950/25 px-6 py-4 shadow-md shadow-black/30 sm:px-10 lg:px-14">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-emerald-400">{SITE_NAME}</p>
            <h1 className="text-xl font-semibold">Koçlarımız</h1>
            <p className="mt-1 text-sm font-medium text-zinc-200">
              Ekibimiz; fotoğraf ve biyografileri senin vereceğin bilgilerle güncelleyebilirsin.
            </p>
          </div>
          <Link
            href="/"
            className="rounded border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Panele dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-14">
        {error && (
          <p className="rounded border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => (
            <article
              key={c.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/50 via-zinc-950/58 to-zinc-950/82 shadow-xl shadow-black/35 ring-1 ring-emerald-500/10"
            >
              <div className="relative aspect-[4/3] w-full bg-zinc-800">
                {c.photoUrl ? (
                  <Image
                    src={c.photoUrl}
                    alt={c.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 33vw"
                    unoptimized={
                      c.photoUrl.endsWith(".svg") || c.photoUrl.startsWith("http")
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl">
                    {c.avatarEmoji ?? "🏋️"}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="text-lg font-semibold text-white">{c.name}</h2>
                {c.title && (
                  <p className="text-sm font-medium text-emerald-300/90">{c.title}</p>
                )}
                <p className="text-sm font-medium leading-relaxed text-zinc-200">{c.bio}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {specialtyTags(c.specialties).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-zinc-600/50 bg-zinc-950/80 px-2 py-0.5 text-[11px] font-medium text-zinc-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {coaches.length === 0 && !error && (
          <p className="mt-8 text-center text-sm font-medium text-zinc-400">Henüz koç kaydı yok.</p>
        )}
      </main>
    </div>
  );
}
