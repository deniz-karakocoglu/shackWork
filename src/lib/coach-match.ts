import type { Coach, GoalFocus } from "@prisma/client";

const FOCUS_KEYWORDS: Record<GoalFocus, string[]> = {
  WEIGHT_LOSS: ["weight_loss", "kilo", "yağ", "kardiyo", "deficit"],
  MUSCLE: ["muscle", "kas", "hipertrofi", "güç", "bulk"],
  PERFORMANCE: ["performance", "atletik", "güç", "hız", "plyo"],
  GENERAL: ["general", "genel", "sağlık", "wellness"],
};

function scoreCoach(coach: Coach, focus: GoalFocus): number {
  const tags = coach.specialties.toLowerCase().split(/[,\s]+/).filter(Boolean);
  const keys = FOCUS_KEYWORDS[focus];
  let score = 0;
  for (const k of keys) {
    if (tags.some((t) => t.includes(k) || k.includes(t))) score += 2;
  }
  if (focus === "GENERAL") score += 1;
  return score;
}

export function pickBestCoach(coaches: Coach[], focus: GoalFocus): Coach | null {
  if (coaches.length === 0) return null;
  let best = coaches[0];
  let bestScore = scoreCoach(best, focus);
  for (let i = 1; i < coaches.length; i++) {
    const s = scoreCoach(coaches[i], focus);
    if (s > bestScore) {
      best = coaches[i];
      bestScore = s;
    }
  }
  return best;
}
