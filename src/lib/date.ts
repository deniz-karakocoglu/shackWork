export function formatLogDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLogDate(): string {
  return formatLogDate(new Date());
}

/** Yerel takvim günü (YYYY-MM-DD) */
export function toLocalYmd(d: Date): string {
  return formatLogDate(d);
}
