import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { Button, Card, EmptyState, Input, Muted, Screen } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { monthsFromNow } from "@/lib/date";
import type { Goal, WeeklyPlan } from "@/lib/types";

export default function PlanScreen() {
  const { token } = useAuth();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [planSource, setPlanSource] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [wp, g] = await Promise.all([
        api.weeklyPlan(token),
        api.goals(token),
      ]);
      setPlan(wp.plan);
      setPlanSource(wp.planSource);
      setGoals(g);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Plan yüklenemedi.");
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function addGoal() {
    if (!token) return;
    if (title.trim().length < 3) {
      setError("Hedef başlığı en az 3 karakter olmalı.");
      return;
    }
    if (description.trim().length < 25) {
      setError("AI için hedef detayı en az 25 karakter olmalı.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.createGoal(token, {
        title: title.trim(),
        description: description.trim(),
        targetDate: monthsFromNow(3),
        durationMonths: 3,
      });
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Hedef eklenemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function generatePlan() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.generateWeeklyPlan(token);
      setPlan(res.plan);
      setPlanSource(res.planSource);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Plan üretilemedi.");
    } finally {
      setBusy(false);
    }
  }

  const hasDetail = goals.some(
    (g) => (g.description?.trim().length ?? 0) >= 25,
  );

  return (
    <Screen style={styles.pad}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Card>
          <Text style={styles.h}>Hedef ekle</Text>
          <Muted>
            3 aylık hedef. AI için detay en az 25 karakter olmalı (gün sayısı,
            ekipman, sağlık notu…).
          </Muted>
          <Input
            placeholder="Başlık (ör. yağ kaybı)"
            value={title}
            onChangeText={setTitle}
          />
          <Input
            placeholder="Detay: haftada 4 gün salon, diz hassasiyeti..."
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.multiline}
          />
          <Button label="Hedef kaydet" onPress={addGoal} loading={busy} />
        </Card>

        <Card>
          <Text style={styles.h}>Kayıtlı hedefler</Text>
          {goals.length === 0 ? (
            <EmptyState>Henüz hedef yok. Yukarıdan ekle.</EmptyState>
          ) : (
            goals.map((g) => (
              <View key={g.id} style={styles.goalRow}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                <Muted>
                  {g.description?.trim()
                    ? g.description
                    : "Detay yok — AI için en az 25 karakter yaz."}
                </Muted>
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text style={styles.h}>Haftalık AI planı</Text>
          <Muted>
            {goals.length === 0
              ? "Önce hedef ekle."
              : hasDetail
                ? `${goals.length} hedef kayıtlı. Programı oluşturabilirsin.`
                : "En az bir hedefte 25+ karakter detay yaz."}
          </Muted>
          <Button
            label="AI ile program oluştur"
            onPress={generatePlan}
            loading={busy}
            disabled={goals.length === 0}
          />
          {planSource ? (
            <Text style={styles.badge}>
              Kaynak: {planSource === "gemini" ? "Gemini AI" : "Kişisel yedek"}
            </Text>
          ) : null}
        </Card>

        {plan ? (
          <>
            <Card>
              <Text style={styles.h}>
                Antrenman · {plan.weekStart} — {plan.weekEnd}
              </Text>
              <Text style={styles.body}>{plan.workoutPlan}</Text>
            </Card>
            <Card>
              <Text style={styles.h}>Beslenme</Text>
              <Text style={styles.body}>{plan.mealPlan}</Text>
            </Card>
          </>
        ) : (
          <Card>
            <Muted>Henüz plan yok. Hedef ekleyip AI butonuna bas.</Muted>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingTop: 8 },
  h: { fontSize: 16, fontWeight: "700", color: "#064e3b", marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 21, color: "#18181b" },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  badge: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  error: { color: "#dc2626", marginBottom: 12 },
  goalRow: { marginBottom: 10 },
  goalTitle: { fontSize: 15, fontWeight: "600", color: "#18181b", marginBottom: 2 },
});
