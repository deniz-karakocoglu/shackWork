export type GoalFocus = "WEIGHT_LOSS" | "MUSCLE" | "PERFORMANCE" | "GENERAL";
export type UserRole = "USER" | "COACH";

export const FOCUS_OPTIONS: { value: GoalFocus; label: string }[] = [
  { value: "WEIGHT_LOSS", label: "Kilo / yağ azaltma" },
  { value: "MUSCLE", label: "Kas & güç" },
  { value: "PERFORMANCE", label: "Performans" },
  { value: "GENERAL", label: "Genel sağlık" },
];

export function focusLabel(focus: GoalFocus | string | null | undefined) {
  return FOCUS_OPTIONS.find((o) => o.value === focus)?.label ?? focus ?? "—";
}

export type Coach = {
  id: string;
  name: string;
  title: string | null;
  bio: string;
  specialties: string;
  avatarEmoji: string | null;
  photoUrl: string | null;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  birthDate: string | null;
  role: UserRole;
  heightCm: number | null;
  goalFocus: GoalFocus;
  coach: Coach | null;
};

export type Goal = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string;
  durationMonths: number | null;
};

export type WeeklyPlan = {
  id: string;
  weekStart: string;
  weekEnd: string;
  focus: GoalFocus;
  workoutPlan: string;
  mealPlan: string;
  createdAt: string;
};

export type DayLog = {
  id: string;
  logDate: string;
  trainingText: string | null;
  mealsText: string | null;
  notes: string | null;
  aiReport: string | null;
};

export type Metric = {
  id: string;
  measuredAt: string;
  weightKg: number;
  bodyFatPercent: number | null;
};

export type MetricsResponse = {
  metrics: Metric[];
  heightCm: number | null;
  bmi: number | null;
  bmiCategory: string | null;
};
