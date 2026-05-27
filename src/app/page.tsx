"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { todayLogDate, toLocalYmd } from "@/lib/date";
import { LOGO_PATH, SITE_NAME } from "@/lib/branding";
import { PasswordStrengthHints } from "@/components/password-strength-hints";
import { isPasswordStrong } from "@/lib/password-policy";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Coach = {
  id: string;
  name: string;
  title: string | null;
  bio: string;
  avatarEmoji: string | null;
  photoUrl?: string | null;
};
type User = {
  id: string;
  email: string;
  name: string | null;
  surname?: string | null;
  birthDate?: string | null;
  role: string;
  heightCm: number | null;
  goalFocus: string;
  coach: Coach | null;
};
type Goal = { id: string; title: string; description?: string | null; targetDate: string; durationMonths: number | null };
type DayLog = { id: string; logDate: string; trainingText: string | null; mealsText: string | null; notes: string | null; aiReport: string | null };
type Photo = { id: string; takenAt: string; imageUrl: string };
type Metric = { weightKg: number; bodyFatPercent: number | null; measuredAt?: string };
type WeeklyPlan = { weekStart: string; weekEnd: string; workoutPlan: string; mealPlan: string } | null;

/** Kart: yesil tint + gradient — arka planla karisinca belirgin; inputlar daha opak. */
const FIELD =
  "w-full rounded-lg border border-zinc-600/75 bg-zinc-950/92 px-3 py-2.5 text-zinc-50 shadow-inner shadow-black/30 outline-none ring-0 placeholder:text-zinc-400 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/30";
const FIELD_SM = `${FIELD} text-sm`;
const JOURNAL_AREA = `${FIELD} min-h-[220px] resize-y px-4 py-4 text-base font-normal leading-relaxed tracking-normal sm:min-h-[280px] sm:text-lg`;
/** Hedef detayı — AI bağlamı; geniş ve rahat yazı alanı. */
const GOAL_DETAIL_AREA = `${FIELD} min-h-[14rem] w-full resize-y px-4 py-3 text-base font-normal leading-relaxed sm:min-h-[16rem] sm:text-lg`;
const CARD =
  "rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/50 via-zinc-950/58 to-zinc-950/82 p-5 shadow-xl shadow-black/35 ring-1 ring-emerald-500/10";

const FOCUS_OPTIONS = [
  { value: "WEIGHT_LOSS", label: "Kilo / yağ azaltma" },
  { value: "MUSCLE", label: "Kas & güç" },
  { value: "PERFORMANCE", label: "Performans" },
  { value: "GENERAL", label: "Genel sağlık" },
];
const BIRTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const BIRTH_MONTHS = [
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
];
const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

type PlanMeta = { source: "gemini" | "personal_fallback"; note: string | null } | null;

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [plan, setPlan] = useState<WeeklyPlan>(null);
  const [planMeta, setPlanMeta] = useState<PlanMeta | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCat, setBmiCat] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [authName, setAuthName] = useState("");
  const [authSurname, setAuthSurname] = useState("");
  const [authBirthDay, setAuthBirthDay] = useState("");
  const [authBirthMonth, setAuthBirthMonth] = useState("");
  const [authBirthYear, setAuthBirthYear] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  const [devShareUrl, setDevShareUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [goalFocus, setGoalFocus] = useState("GENERAL");
  const [weightIn, setWeightIn] = useState("");
  const [fatIn, setFatIn] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalMonths, setGoalMonths] = useState("3");
  const [reportBusy, setReportBusy] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);
  const today = useMemo(() => todayLogDate(), []);
  const [logDate, setLogDate] = useState(today);
  const [trainingText, setTrainingText] = useState("");
  const [mealsText, setMealsText] = useState("");
  const [notesText, setNotesText] = useState("");

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [compareSplit, setCompareSplit] = useState(50);

  const [adminSecret, setAdminSecret] = useState("");
  const [adminTargetEmail, setAdminTargetEmail] = useState("");
  const [adminRole, setAdminRole] = useState<"USER" | "COACH">("COACH");
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const selectedLog = useMemo(() => logs.find((l) => l.logDate === logDate) ?? null, [logs, logDate]);
  const aiReportSections = useMemo(() => {
    const raw = selectedLog?.aiReport?.trim();
    if (!raw) return [];
    const blocks = raw.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    return blocks.map((block) => {
      const lines = block.split("\n");
      const first = lines[0]?.trim() ?? "";
      const isTitle = first.startsWith("**") && first.endsWith("**");
      const title = isTitle ? first.replace(/^\*\*|\*\*$/g, "") : "";
      const body = isTitle ? lines.slice(1).join("\n").trim() : block;
      return { title, body };
    });
  }, [selectedLog?.aiReport]);
  const chartData = useMemo(
    () =>
      [...metrics]
        .reverse()
        .map((m, i) => ({ index: i + 1, kilo: m.weightKg, yag: m.bodyFatPercent ?? undefined })),
    [metrics],
  );

  const logDateSet = useMemo(() => new Set(logs.map((l) => l.logDate)), [logs]);

  const photoDateSet = useMemo(() => {
    const s = new Set<string>();
    for (const p of photos) s.add(toLocalYmd(new Date(p.takenAt)));
    return s;
  }, [photos]);

  const aiLogDateSet = useMemo(
    () => new Set(logs.filter((l) => l.aiReport?.trim()).map((l) => l.logDate)),
    [logs],
  );

  const goalDeadlineSet = useMemo(() => {
    const s = new Set<string>();
    for (const g of goals) s.add(toLocalYmd(new Date(g.targetDate)));
    return s;
  }, [goals]);

  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()),
    [photos],
  );

  const calendarCells = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const first = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0).getDate();
    const startPad = (first.getDay() + 6) % 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= lastDay; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return { y, m, cells };
  }, [monthCursor]);

  const photoA = useMemo(
    () => sortedPhotos.find((p) => p.id === compareA) ?? null,
    [sortedPhotos, compareA],
  );
  const photoB = useMemo(
    () => sortedPhotos.find((p) => p.id === compareB) ?? null,
    [sortedPhotos, compareB],
  );

  useEffect(() => {
    if (sortedPhotos.length >= 2 && (!compareA || !compareB)) {
      setCompareA(sortedPhotos[0]?.id ?? "");
      setCompareB(sortedPhotos[1]?.id ?? "");
    }
  }, [sortedPhotos, compareA, compareB]);

  const refreshWeeklyPlan = useCallback(async (): Promise<boolean> => {
    const res = await fetch("/api/plans/weekly", { method: "POST", cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      plan?: WeeklyPlan | null;
      planSource?: string;
      planNote?: string | null;
      error?: string;
      code?: string;
    };
    if (!res.ok) {
      setPlan(null);
      const note =
        typeof data.planNote === "string" && data.planNote.trim()
          ? data.planNote.trim()
          : typeof data.error === "string"
            ? data.error
            : `Plan oluşturulamadı (${res.status})`;
      setPlanMeta(null);
      setError(note);
      return false;
    }
    if (!data.plan) {
      setPlan(null);
      setPlanMeta(null);
      setError("Plan üretilemedi.");
      return false;
    }
    setPlan(data.plan);
    setPlanMeta({
      source: data.planSource === "personal_fallback" ? "personal_fallback" : "gemini",
      note: typeof data.planNote === "string" && data.planNote.trim() ? data.planNote.trim() : null,
    });
    setError(null);
    return true;
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const session = await fetch("/api/auth/me");
    const sessionData = await session.json();
    const user = (sessionData.user ?? null) as User | null;
    setAuthUser(user);
    if (!user) {
      setPlan(null);
      setPlanMeta(null);
      setLoading(false);
      return;
    }

    try {
      const [ch, gl, ph, mRes, lr, planRes] = await Promise.all([
        fetch("/api/coaches"),
        fetch("/api/goals"),
        fetch("/api/photos"),
        fetch("/api/metrics"),
        fetch("/api/day-logs"),
        fetch("/api/plans/weekly", { cache: "no-store" }),
      ]);
      setName(user.name ?? "");
      setHeightCm(user.heightCm != null ? String(user.heightCm) : "");
      setGoalFocus(user.goalFocus);
      if (ch.ok) setCoaches(await ch.json());
      if (gl.ok) setGoals(await gl.json());
      if (ph.ok) setPhotos(await ph.json());
      if (lr.ok) setLogs(await lr.json());
      if (planRes.ok) {
        const pd = (await planRes.json()) as {
          plan?: WeeklyPlan | null;
          planSource?: string;
        };
        setPlan(pd.plan ?? null);
        setPlanMeta(
          pd.plan
            ? {
                source: pd.planSource === "personal_fallback" ? "personal_fallback" : "gemini",
                note: null,
              }
            : null,
        );
      } else {
        setPlan(null);
        setPlanMeta(null);
      }
      if (mRes.ok) {
        const m = await mRes.json();
        setMetrics(m.metrics ?? []);
        setBmi(m.bmi ?? null);
        setBmiCat(m.bmiCategory ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme hatası.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!authUser) {
      setDevShareUrl(null);
      return;
    }
    let cancelled = false;
    async function poll() {
      const r = await fetch("/api/dev/share-link", { cache: "no-store" });
      if (cancelled) return;
      const j = (await r.json().catch(() => ({}))) as { url?: string | null };
      setDevShareUrl(typeof j.url === "string" && j.url.length > 0 ? j.url : null);
    }
    void poll();
    const id = window.setInterval(() => void poll(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [authUser?.id]);
  useEffect(() => {
    const found = logs.find((l) => l.logDate === logDate);
    setTrainingText(found?.trainingText ?? "");
    setMealsText(found?.mealsText ?? "");
    setNotesText(found?.notes ?? "");
  }, [logs, logDate]);

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    if (authMode === "register") {
      if (!isPasswordStrong(password)) {
        setError("Şifre güçlü değil; aşağıdaki kuralların tamamını sağla.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("Şifreler uyuşmuyor.");
        return;
      }
    }
    const url = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: authName,
        surname: authSurname,
        birthDay: authBirthDay === "" ? null : Number(authBirthDay),
        birthMonth: authBirthMonth === "" ? null : Number(authBirthMonth),
        birthYear: authBirthYear === "" ? null : Number(authBirthYear),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Giriş veya kayıt hatası.");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
    setAuthName("");
    setAuthSurname("");
    setAuthBirthDay("");
    setAuthBirthMonth("");
    setAuthBirthYear("");
    setLoading(true);
    await load();
  }

  async function submitForgotPassword() {
    setForgotMsg(null);
    setError(null);
    setForgotBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "İstek başarısız.");
        return;
      }
      setForgotMsg(
        typeof data.message === "string"
          ? data.message
          : "E-posta kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
      );
    } finally {
      setForgotBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setPlan(null);
    setPlanMeta(null);
    setLoading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        heightCm: heightCm === "" ? null : Number(heightCm),
        goalFocus,
      }),
    });
    if (!res.ok) return setError("Profil kaydedilemedi.");
    await load();
  }
  async function matchCoach() { await fetch("/api/coaches/match", { method: "POST" }); await load(); }
  async function saveMetric(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weightKg: Number(weightIn), bodyFatPercent: fatIn ? Number(fatIn) : null }) });
    if (!res.ok) return setError("Ölçüm kaydedilemedi.");
    setWeightIn(""); setFatIn(""); await load();
  }
  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const months = Math.max(1, Number(goalMonths) || 3);
    const end = new Date(); end.setMonth(end.getMonth() + months);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: goalTitle,
        description: goalDescription.trim() || null,
        targetDate: end.toISOString(),
        durationMonths: months,
      }),
    });
    if (!res.ok) return setError("Hedef eklenemedi.");
    setGoalTitle("");
    setGoalDescription("");
    await load();
  }
  async function saveDayLog(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/day-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logDate, trainingText, mealsText, notes: notesText }) });
    if (!res.ok) return setError("Günlük kaydedilemedi.");
    await load();
  }
  async function generateReport() {
    setReportBusy(true);
    try {
      setError(null);
      // AI rapor uretmeden once ilgili gunun kaydi olusturulur/guncellenir.
      const saveRes = await fetch("/api/day-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logDate, trainingText, mealsText, notes: notesText }),
      });
      if (!saveRes.ok) {
        setError("Önce günlük kaydı oluşturulamadı.");
        return;
      }

      const res = await fetch(`/api/day-logs/${logDate}/report`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Rapor üretilemedi.");
        return;
      }
      await load();
    } finally {
      setReportBusy(false);
    }
  }
  async function generatePlan() {
    if (goals.length === 0) {
      setError("Önce en az bir hedef ekle; program AI ile hedeflerine göre üretilir.");
      return;
    }
    const hasDetail = goals.some(
      (g) => g.title.trim().length >= 3 && (g.description?.trim().length ?? 0) >= 25,
    );
    if (!hasDetail) {
      setError(
        "En az bir hedefte detay alanına en az 25 karakter yaz (gün sayısı, ekipman, beslenme vb.).",
      );
      return;
    }
    setPlanBusy(true);
    try {
      await refreshWeeklyPlan();
    } finally {
      setPlanBusy(false);
    }
  }

  const downloadWeeklyPlanPdf = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/plans/weekly/pdf", {
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
        setError("Sunucu PDF döndürmedi; oturum açmanız gerekebilir.");
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
      setError("PDF indirilemedi.");
    }
  }, []);

  async function submitAdminRole(e: React.FormEvent) {
    e.preventDefault();
    setAdminMsg(null);
    const res = await fetch("/api/admin/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: adminSecret,
        email: adminTargetEmail.trim().toLowerCase(),
        role: adminRole,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAdminMsg(typeof data.error === "string" ? data.error : "Başarısız.");
      return;
    }
    setAdminMsg(`Tamam: ${data.user?.email} artik ${data.user?.role}.`);
    setAdminSecret("");
    setAdminTargetEmail("");
  }
  async function removeGoal(id: string) { await fetch(`/api/goals/${id}`, { method: "DELETE" }); await load(); }
  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/photos", { method: "POST", body: fd });
    if (!res.ok) setError("Fotoğraf yüklenemedi."); else await load();
  }

  if (loading) return <div className="min-h-dvh flex items-center justify-center bg-transparent p-10 text-lg font-medium text-zinc-100">Yükleniyor…</div>;

  if (!authUser) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center bg-transparent p-6 text-zinc-50">
        <Link
          href="/koclar"
          className="mb-4 text-sm text-emerald-400 underline decoration-emerald-500/50 underline-offset-4 hover:text-emerald-300"
        >
          Koçlarımızı gör
        </Link>
        <form onSubmit={submitAuth} className="w-full max-w-md space-y-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/45 via-zinc-950/65 to-zinc-950/88 p-6 shadow-xl shadow-black/40 ring-1 ring-emerald-500/10">
          <div className="flex flex-col items-center gap-2 pb-1">
            <Image
              src={LOGO_PATH}
              alt={`${SITE_NAME} logo`}
              width={200}
              height={200}
              className="h-40 w-40 object-contain drop-shadow-[0_4px_28px_rgba(0,0,0,0.5)] sm:h-44 sm:w-44"
              priority
              unoptimized
            />
            <h1 className="sr-only">{SITE_NAME}</h1>
          </div>
          <p className="text-sm font-medium text-zinc-200">Çoklu kullanıcı için giriş veya kayıt.</p>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {authMode === "register" && (
            <>
              <input
                className={FIELD_SM}
                placeholder="Ad"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
              />
              <input
                className={FIELD_SM}
                placeholder="Soyad"
                value={authSurname}
                onChange={(e) => setAuthSurname(e.target.value)}
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  className={`${FIELD_SM} min-h-11 sm:text-base`}
                  value={authBirthDay}
                  onChange={(e) => setAuthBirthDay(e.target.value)}
                  required
                >
                  <option value="">Gün</option>
                  {BIRTH_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <select
                  className={`${FIELD_SM} min-h-11 sm:text-base`}
                  value={authBirthMonth}
                  onChange={(e) => setAuthBirthMonth(e.target.value)}
                  required
                >
                  <option value="">Ay</option>
                  {BIRTH_MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  className={`${FIELD_SM} min-h-11 sm:text-base`}
                  value={authBirthYear}
                  onChange={(e) => setAuthBirthYear(e.target.value)}
                  required
                >
                  <option value="">Yıl</option>
                  {BIRTH_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-zinc-400">Platform 16 yaş ve üzeri kullanıcılar içindir.</p>
            </>
          )}
          <input
            className={`${FIELD_SM} min-h-11`}
            placeholder="E-posta"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className={`${FIELD_SM} min-h-11`}
            placeholder={authMode === "register" ? "Şifre (güçlü)" : "Şifre"}
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={authMode === "register" ? 8 : undefined}
          />
          {authMode === "register" && (
            <>
              <PasswordStrengthHints
                password={password}
                confirm={passwordConfirm}
                showConfirmMatch
              />
              <input
                type="password"
                className={`${FIELD_SM} min-h-11`}
                placeholder="Şifre (tekrar)"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                minLength={8}
                required
              />
            </>
          )}
          <button className="w-full rounded-lg bg-emerald-600 py-2.5 font-semibold hover:bg-emerald-500">{authMode === "login" ? "Giriş yap" : "Kayıt ol"}</button>
          <button type="button" className="w-full text-sm font-medium text-zinc-300 hover:text-zinc-100" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
            {authMode === "login" ? "Hesabın yok mu? Kayıt ol" : "Hesabın var mı? Giriş yap"}
          </button>
          <div className="mt-2 border-t border-zinc-600/50 pt-3">
            <p className="mb-2 text-xs font-medium text-zinc-300">Şifremi unuttum</p>
            <div className="space-y-2">
              <input
                className={FIELD_SM}
                placeholder="E-posta"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <button
                type="button"
                onClick={submitForgotPassword}
                disabled={forgotBusy}
                className="w-full rounded border border-emerald-500/40 py-2 text-sm text-emerald-200 disabled:opacity-60"
              >
                {forgotBusy ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
              </button>
            </div>
            {forgotMsg && <p className="mt-2 text-xs text-emerald-300">{forgotMsg}</p>}
          </div>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-transparent text-zinc-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 bg-gradient-to-b from-zinc-950/80 via-zinc-950/55 to-emerald-950/25 px-6 py-5 shadow-md shadow-black/30 sm:px-10 lg:px-12">
        <div className="flex items-center gap-4 sm:gap-5">
          <Image
            src={LOGO_PATH}
            alt={`${SITE_NAME} logo`}
            width={200}
            height={200}
            className="h-36 w-36 shrink-0 object-contain drop-shadow-[0_4px_28px_rgba(0,0,0,0.5)] sm:h-44 sm:w-44"
            priority
            unoptimized
          />
          <h1 className="text-xl font-semibold text-zinc-200 sm:text-2xl">Kişisel panel</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/koclar"
            className="rounded border border-emerald-500/35 px-3 py-1.5 text-emerald-200 hover:bg-emerald-950/40"
          >
            Koçlar
          </Link>
          <Link
            href="/rapor/haftalik"
            className="rounded border border-white/20 px-3 py-1.5 hover:bg-white/5"
          >
            Haftalık rapor (yazdır)
          </Link>
          {authUser.role === "COACH" && (
            <Link href="/coach" className="rounded border border-emerald-500/40 px-3 py-1.5 text-emerald-200 hover:bg-emerald-950/40">
              Koç paneli
            </Link>
          )}
          <button type="button" onClick={logout} className="rounded border border-white/20 px-3 py-1.5">
            Çıkış
          </button>
        </nav>
      </header>
      {devShareUrl && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-emerald-500/35 bg-emerald-950/45 px-6 py-2.5 text-sm text-zinc-200 sm:px-10 lg:px-12">
          <span className="shrink-0 font-medium text-emerald-200/90">Dış paylaşım (dev)</span>
          <a
            href={devShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 break-all font-mono text-xs text-emerald-100 underline decoration-emerald-500/50 underline-offset-2 sm:text-sm"
          >
            {devShareUrl}
          </a>
          <button
            type="button"
            className="shrink-0 rounded border border-emerald-500/50 px-2.5 py-1 text-xs font-medium text-emerald-100 hover:bg-emerald-900/60"
            onClick={() => void navigator.clipboard.writeText(devShareUrl)}
          >
            Kopyala
          </button>
        </div>
      )}
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8 sm:px-10 lg:px-14">
        {error && <div className="rounded-lg border border-red-500/50 bg-red-950/80 p-4 text-sm text-red-100">{error}</div>}

        <section className="grid gap-5 md:grid-cols-2">
          <form onSubmit={saveProfile} className={`${CARD} space-y-3`}>
            <h2 className="text-lg font-semibold text-white">Profil ve koç</h2>
            <input className={FIELD_SM} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad" />
            <input className={FIELD_SM} type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Boy (cm)" />
            <select className={FIELD_SM} value={goalFocus} onChange={(e) => setGoalFocus(e.target.value)}>
              {FOCUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">Profili kaydet</button>
            <button type="button" onClick={matchCoach} className="rounded-lg border border-emerald-500/50 px-3 py-2 text-sm hover:bg-emerald-950/50">En uygun koçu ata</button>
            <p className="text-sm font-medium text-zinc-100">Aktif koç: {authUser.coach?.name ?? "—"}</p>
            <p className="text-xs text-zinc-400">Toplam koç: {coaches.length}</p>
          </form>

          <div className={CARD}>
            <h2 className="text-lg font-semibold text-white">Kilo / yağ grafiği</h2>
            <p className="mt-1 text-sm font-medium text-zinc-100">VKİ: {bmi ?? "—"} {bmiCat ? `(${bmiCat})` : ""}</p>
            <form onSubmit={saveMetric} className="mt-4 flex flex-wrap gap-2">
              <input className={`${FIELD_SM} w-28`} type="number" placeholder="Kilo" value={weightIn} onChange={(e) => setWeightIn(e.target.value)} required />
              <input className={`${FIELD_SM} w-28`} type="number" placeholder="Yağ %" value={fatIn} onChange={(e) => setFatIn(e.target.value)} />
              <button className="rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600">Ekle</button>
            </form>
            <a
              href="/api/metrics/export"
              className="mt-3 inline-block text-xs font-medium text-emerald-300 underline underline-offset-2"
            >
              Ölçümleri CSV indir
            </a>
            <div className="mt-4 h-52 min-h-[13rem] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="index" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="kilo" name="Kilo (kg)" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="yag" name="Yağ %" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className={CARD}>
          <h2 className="text-lg font-semibold text-white">3 aylık hedef ve haftalık program</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Yeni hesapta antrenman ve beslenme programı <strong className="text-zinc-100">yoktur</strong>. Hedefini ve
            detayını yazdıktan sonra <strong className="text-emerald-200">AI ile program oluştur</strong> — her kullanıcıya
            farklı plan üretilir (ortak şablon yok).
          </p>
          {planMeta && (
            <div
              className={`mt-3 rounded-lg border px-3 py-2.5 text-sm ${
                planMeta.source === "gemini"
                  ? "border-emerald-500/45 bg-emerald-950/45 text-emerald-100"
                  : "border-amber-500/40 bg-amber-950/35 text-amber-50"
              }`}
            >
              <p className="font-medium">
                {planMeta.source === "gemini"
                  ? "Haftalık plan: Gemini ile hedeflerine göre üretildi."
                  : "Haftalık plan: kişisel yedek (Gemini şu an yanıt vermedi)."}
              </p>
              {planMeta.note ? (
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
                  {planMeta.note}
                </p>
              ) : null}
            </div>
          )}
          {!plan && goals.length === 0 && (
            <p className="mt-3 rounded-lg border border-zinc-600/40 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-300">
              Henüz program yok. Aşağıdan ilk hedefini ekle.
            </p>
          )}
          {!plan && goals.length > 0 && (
            <p className="mt-3 rounded-lg border border-amber-500/35 bg-amber-950/30 px-3 py-2.5 text-sm text-amber-50">
              Hedefin kayıtlı; antrenman ve beslenme için «AI ile program oluştur»a bas (detay alanı en az 25 karakter
              olmalı).
            </p>
          )}
          <form onSubmit={addGoal} className="mt-4 flex w-full flex-col gap-4">
            <input
              className={`${FIELD} py-3 text-base`}
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Hedef başlığı (zorunlu)"
            />
            <textarea
              className={GOAL_DETAIL_AREA}
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="Detay: haftada kaç gün spor, ekipman, sağlık notu, yarış tarihi, beslenme tercihleri… (AI burayı okuyarak plan yazar)"
              rows={10}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input className={`${FIELD_SM} w-20`} type="number" value={goalMonths} onChange={(e) => setGoalMonths(e.target.value)} title="Ay" />
              <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">Hedef ekle</button>
              <button
                type="button"
                onClick={generatePlan}
                disabled={planBusy}
                className="rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-3 py-2 text-sm font-medium hover:bg-emerald-900/50 disabled:opacity-50"
              >
                {planBusy ? "AI plan üretiyor…" : plan ? "Programı yenile (AI)" : "AI ile program oluştur"}
              </button>
            <Link
              href="/rapor/haftalik"
              className="inline-flex items-center rounded-lg border border-emerald-500/25 bg-gradient-to-r from-zinc-800/70 to-zinc-800/85 px-3 py-2 text-sm font-medium text-zinc-100 hover:from-zinc-700/80 hover:to-zinc-700/90"
            >
              Rapor sayfası
            </Link>
            {plan && (
              <button
                type="button"
                onClick={() => void downloadWeeklyPlanPdf()}
                className="inline-flex items-center rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-zinc-900/70 px-3 py-2 text-sm font-medium text-amber-100 hover:from-amber-900/50 hover:to-zinc-800/80"
              >
                PDF indir
              </button>
            )}
            </div>
          </form>
          <ul className="mt-4 space-y-2 text-sm text-zinc-200">
            {goals.map((g) => (
              <li key={g.id} className="flex justify-between gap-2 rounded-lg border border-emerald-500/15 bg-zinc-900/55 px-3 py-2 text-zinc-100">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{g.title}</p>
                  {g.description?.trim() ? (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-400">{g.description}</p>
                  ) : null}
                </div>
                <button type="button" onClick={() => removeGoal(g.id)} className="shrink-0 text-red-300 hover:text-red-200">
                  Sil
                </button>
              </li>
            ))}
          </ul>
          {plan && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/15 bg-gradient-to-br from-zinc-950/50 via-zinc-950/65 to-emerald-950/20 p-4">
                <h3 className="mb-2 text-sm font-semibold text-emerald-300">Antrenman programı</h3>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-100 sm:text-base">{plan.workoutPlan}</pre>
              </div>
              <div className="rounded-lg border border-emerald-500/15 bg-gradient-to-br from-zinc-950/50 via-zinc-950/65 to-emerald-950/20 p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-300/90">Beslenme / öğün planı</h3>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-100 sm:text-base">{plan.mealPlan}</pre>
              </div>
              <p className="text-xs font-medium text-zinc-400 lg:col-span-2">
                Plan yalnızca <strong className="text-zinc-300">Gemini</strong> ile üretilir; sunucuda{" "}
                <code className="rounded bg-zinc-800 px-1 text-zinc-200">GEMINI_API_KEY</code> gerekir. «Programı yenile»
                her seferinde hedeflerine göre yeni içerik üretir. PDF, kayıtlı metni indirir.
              </p>
            </div>
          )}
        </section>

        <section className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-white">Takvim (günlük kayıtları)</h2>
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                className="rounded border border-white/20 px-2 py-1"
                onClick={() =>
                  setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
              >
                ‹
              </button>
              <span className="font-medium text-zinc-100">
                {monthCursor.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
              </span>
              <button
                type="button"
                className="rounded border border-white/20 px-2 py-1"
                onClick={() =>
                  setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
              >
                ›
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-400">
            {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((d) => (
              <div key={d} className="py-1 font-medium">
                {d}
              </div>
            ))}
            {calendarCells.cells.map((day, idx) => {
              if (day == null) {
                return <div key={`e-${idx}`} className="aspect-square rounded-md bg-zinc-900/40 ring-1 ring-emerald-500/10" />;
              }
              const ymd = `${calendarCells.y}-${String(calendarCells.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const has = logDateSet.has(ymd);
              const active = ymd === logDate;
              const hasPhoto = photoDateSet.has(ymd);
              const hasAi = aiLogDateSet.has(ymd);
              const hasGoalEnd = goalDeadlineSet.has(ymd);
              return (
                <button
                  key={ymd}
                  type="button"
                  onClick={() => setLogDate(ymd)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition ${
                    active
                      ? "border-emerald-500 bg-emerald-900/40 text-white shadow-md shadow-emerald-900/30"
                      : has
                        ? "border-emerald-500/35 bg-gradient-to-br from-emerald-950/40 to-zinc-800/90 font-medium text-zinc-50"
                        : "border-zinc-600/40 bg-zinc-900/45 text-zinc-300 hover:border-emerald-500/30 hover:text-zinc-100"
                  }`}
                >
                  <span>{day}</span>
                  <span className="mt-1 flex gap-0.5" aria-hidden>
                    {has && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Günlük" />
                    )}
                    {hasPhoto && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Fotoğraf" />
                    )}
                    {hasAi && (
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" title="AI" />
                    )}
                    {hasGoalEnd && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" title="Hedef bitişi" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs font-medium text-zinc-300">
            Noktalar: yeşil günlük, turuncu fotoğraf, mor AI raporu, pembe hedef bitiş tarihi.
          </p>
        </section>

        <section className={CARD}>
          <h2 className="text-lg font-semibold text-white">Günlük + AI rapor + fotoğraf</h2>
          <form onSubmit={saveDayLog} className="mt-4 grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">Tarih</label>
              <input className={FIELD_SM} type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">Antrenman notu</label>
              <textarea className={JOURNAL_AREA} rows={8} placeholder="Bugün ne çalıştın? Set/tekrar kısaca yazabilirsin." value={trainingText} onChange={(e) => setTrainingText(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">Öğünler / beslenme</label>
              <textarea className={JOURNAL_AREA} rows={8} placeholder="Kahvaltı, öğle, akşam… ne yedin?" value={mealsText} onChange={(e) => setMealsText(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-300">Ek not</label>
              <textarea className={`${JOURNAL_AREA} min-h-[180px] sm:min-h-[200px]`} rows={5} placeholder="Uyku, su, ruh hali…" value={notesText} onChange={(e) => setNotesText(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-600">Günü kaydet</button>
              <button type="button" onClick={generateReport} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500">{reportBusy ? "…" : "AI rapor"}</button>
            </div>
          </form>
          {aiReportSections.length > 0 && (
            <div className="mt-3 grid gap-2">
              {aiReportSections.map((section, idx) => (
                <div
                  key={`${section.title}-${idx}`}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 p-4"
                >
                  {section.title && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      {section.title}
                    </p>
                  )}
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-100">{section.body}</pre>
                </div>
              ))}
            </div>
          )}
          <input type="file" accept="image/*" onChange={uploadPhoto} className="mt-6 block text-sm font-medium text-zinc-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-emerald-600" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.imageUrl} alt="" className="rounded aspect-[3/4] object-cover" />
            ))}
          </div>

          {sortedPhotos.length >= 2 && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-white">Fotoğraf karşılaştırma (slider)</h3>
              <p className="mt-1 text-xs font-medium text-zinc-300">
                Üstteki fotoğraf soldan sağa açılır; altta ikinci fotoğraf sabit kalır.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  className={`${FIELD_SM} max-w-[200px] py-1.5 text-xs`}
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                >
                  {sortedPhotos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {new Date(p.takenAt).toLocaleDateString("tr-TR")} — A
                    </option>
                  ))}
                </select>
                <select
                  className={`${FIELD_SM} max-w-[200px] py-1.5 text-xs`}
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                >
                  {sortedPhotos.map((p) => (
                    <option key={`b-${p.id}`} value={p.id}>
                      {new Date(p.takenAt).toLocaleDateString("tr-TR")} — B
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative mx-auto mt-4 aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-black">
                {photoB && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoB.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {photoA && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoA.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ clipPath: `inset(0 ${100 - compareSplit}% 0 0)` }}
                  />
                )}
              </div>
              <label className="mt-3 block text-xs font-semibold text-zinc-300">
                Slider: {compareSplit}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={compareSplit}
                  onChange={(e) => setCompareSplit(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
              </label>
            </div>
          )}
        </section>

        <details className={`${CARD} text-sm`}>
          <summary className="cursor-pointer font-semibold text-zinc-100">
            Yönetim: koç rolü ata (gizli anahtar)
          </summary>
          <p className="mt-2 text-xs font-medium text-zinc-400">
            Sunucuda <code className="rounded bg-white/10 px-1">SHACKWORK_ADMIN_SECRET</code> tanımlı
            olmalı (en az 8 karakter). Mevcut kullanıcıya koç rolü vermek için e-posta gir.
          </p>
          <form onSubmit={submitAdminRole} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              type="password"
              className={FIELD_SM}
              placeholder="Admin secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
            />
            <input
              className={FIELD_SM}
              placeholder="Hedef kullanıcı e-postası"
              value={adminTargetEmail}
              onChange={(e) => setAdminTargetEmail(e.target.value)}
            />
            <select
              className={FIELD_SM}
              value={adminRole}
              onChange={(e) => setAdminRole(e.target.value as "USER" | "COACH")}
            >
              <option value="COACH">COACH</option>
              <option value="USER">USER</option>
            </select>
            <button type="submit" className="rounded bg-zinc-700 px-3 py-2 text-sm text-white">
              Rolü güncelle
            </button>
          </form>
          {adminMsg && <p className="mt-2 text-xs text-emerald-300">{adminMsg}</p>}
        </details>
      </main>
    </div>
  );
}
