export function computeBmi(weightKg: number, heightCm: number): number | null {
  if (heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  return Math.round(bmi * 10) / 10;
}

export function bmiCategoryTr(bmi: number): string {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Fazla kilolu";
  return "Obezite";
}
