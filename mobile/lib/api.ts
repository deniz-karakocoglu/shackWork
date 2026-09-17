import { API_URL } from "./config";
import type {
  DayLog,
  Goal,
  GoalFocus,
  MetricsResponse,
  User,
  WeeklyPlan,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...init } = opts;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `İstek başarısız (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  return data as T;
}

export const api = {
  login(email: string, password: string) {
    return request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(payload: {
    email: string;
    password: string;
    name: string;
    surname: string;
    birthDay: number;
    birthMonth: number;
    birthYear: number;
  }) {
    return request<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  forgotPassword(email: string) {
    return request<{ ok: boolean; message: string }>(
      "/api/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    );
  },

  resetPassword(token: string, newPassword: string) {
    return request<{ ok: boolean; message: string }>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      },
    );
  },

  me(token: string) {
    return request<{ user: User | null }>("/api/auth/me", { token });
  },

  updateMe(
    token: string,
    data: {
      name?: string | null;
      heightCm?: number | null;
      goalFocus?: GoalFocus;
    },
  ) {
    return request<User>("/api/me", {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    });
  },

  goals(token: string) {
    return request<Goal[]>("/api/goals", { token });
  },

  createGoal(
    token: string,
    data: {
      title: string;
      description: string;
      targetDate: string;
      durationMonths?: number;
    },
  ) {
    return request<Goal>("/api/goals", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  weeklyPlan(token: string) {
    return request<{
      plan: WeeklyPlan | null;
      planSource: "gemini" | "personal_fallback" | null;
    }>("/api/plans/weekly", { token });
  },

  generateWeeklyPlan(token: string) {
    return request<{
      plan: WeeklyPlan;
      planSource: string;
      planNote?: string | null;
    }>("/api/plans/weekly", { method: "POST", token });
  },

  metrics(token: string) {
    return request<MetricsResponse>("/api/metrics", { token });
  },

  addMetric(
    token: string,
    data: { weightKg: number; bodyFatPercent?: number | null },
  ) {
    return request<unknown>("/api/metrics", {
      method: "POST",
      token,
      body: JSON.stringify({
        weightKg: data.weightKg,
        bodyFatPercent: data.bodyFatPercent ?? null,
        measuredAt: new Date().toISOString(),
      }),
    });
  },

  dayLogs(token: string) {
    return request<DayLog[]>("/api/day-logs", { token });
  },

  upsertDayLog(
    token: string,
    data: {
      logDate: string;
      trainingText?: string;
      mealsText?: string;
      notes?: string;
    },
  ) {
    return request<DayLog>("/api/day-logs", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  generateDayReport(token: string, logDate: string) {
    return request<{ log: DayLog; report: string }>(
      `/api/day-logs/${logDate}/report`,
      { method: "POST", token },
    );
  },
};
