export function isCoachEmail(email: string): boolean {
  const raw = process.env.SHACKWORK_COACH_EMAILS ?? "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  return set.has(email.trim().toLowerCase());
}
