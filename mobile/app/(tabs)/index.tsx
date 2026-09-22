import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { Card, EmptyState, Muted, Screen, Title } from "@/components/ui";
import { WeightChart } from "@/components/WeightChart";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Goal, MetricsResponse } from "@/lib/types";

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [m, g] = await Promise.all([
        api.metrics(token),
        api.goals(token),
      ]);
      setMetrics(m);
      setGoals(g);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Veri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const latest = metrics?.metrics[0];
  const displayName = [user?.name, user?.surname].filter(Boolean).join(" ");

  return (
    <Screen style={styles.screenPad}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.brand}>shackWork</Text>
        <Title>Merhaba{displayName ? `, ${displayName}` : ""}</Title>
        <Muted>Kişisel antrenman ve beslenme panelin.</Muted>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && !metrics ? (
          <ActivityIndicator style={styles.mt} color="#047857" />
        ) : null}

        <Card style={styles.mt}>
          <Text style={styles.cardTitle}>Son kilo</Text>
          {latest ? (
            <Text style={styles.bigNumber}>{latest.weightKg} kg</Text>
          ) : (
            <Muted>Henüz ölçüm yok — Profil sekmesinden ekleyebilirsin.</Muted>
          )}
          {metrics?.bmi != null ? (
            <Muted>
              VKİ: {metrics.bmi.toFixed(1)}
              {metrics.bmiCategory ? ` (${metrics.bmiCategory})` : ""}
            </Muted>
          ) : (
            <Muted>
              VKİ için profilde boyunu kaydet, ardından kilo ekle.
            </Muted>
          )}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Kilo grafiği</Text>
          {metrics?.metrics?.length ? (
            <WeightChart metrics={metrics.metrics} />
          ) : (
            <EmptyState>
              Ölçüm ekledikçe kilo trendin burada görünür.
            </EmptyState>
          )}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Hedefler ({goals.length})</Text>
          {goals.length === 0 ? (
            <Muted>
              AI plan için en az bir hedef ve 25+ karakter detay gerekli. Plan
              sekmesinden hedef ekleyebilirsin.
            </Muted>
          ) : (
            goals.slice(0, 3).map((g) => (
              <View key={g.id} style={styles.goalRow}>
                <Text style={styles.goalTitle}>{g.title}</Text>
                {g.description ? (
                  <Muted>{g.description.slice(0, 80)}{g.description.length > 80 ? "…" : ""}</Muted>
                ) : null}
              </View>
            ))
          )}
        </Card>

        {user?.coach ? (
          <Card>
            <Text style={styles.cardTitle}>Koçun</Text>
            <Text style={styles.goalTitle}>{user.coach.name}</Text>
            <Muted>{user.coach.title ?? user.coach.specialties}</Muted>
          </Card>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>Koçun</Text>
            <Muted>Henüz atanmış bir koç yok.</Muted>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenPad: { paddingTop: 8 },
  brand: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mt: { marginTop: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#064e3b", marginBottom: 8 },
  bigNumber: { fontSize: 32, fontWeight: "800", color: "#047857" },
  goalRow: { marginBottom: 10 },
  goalTitle: { fontSize: 15, fontWeight: "600", color: "#18181b" },
  error: { color: "#dc2626", marginTop: 12 },
});
