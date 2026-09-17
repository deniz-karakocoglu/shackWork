import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  Chip,
  Input,
  Muted,
  Screen,
  Title,
} from "@/components/ui";
import { API_URL } from "@/lib/config";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FOCUS_OPTIONS, type GoalFocus } from "@/lib/types";

export default function ProfileScreen() {
  const { user, token, signOut, applyUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [heightCm, setHeightCm] = useState(
    user?.heightCm != null ? String(user.heightCm) : "",
  );
  const [goalFocus, setGoalFocus] = useState<GoalFocus>(
    user?.goalFocus ?? "GENERAL",
  );
  const [weight, setWeight] = useState("");
  const [fat, setFat] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [metricBusy, setMetricBusy] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setHeightCm(user?.heightCm != null ? String(user.heightCm) : "");
    setGoalFocus(user?.goalFocus ?? "GENERAL");
  }, [user]);

  async function saveProfile() {
    if (!token) return;
    const height =
      heightCm.trim() === "" ? null : Number(heightCm.replace(",", "."));
    if (height != null && (!Number.isFinite(height) || height < 100 || height > 250)) {
      setError("Boy 100–250 cm arasında olmalı.");
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const updated = await api.updateMe(token, {
        name: name.trim() || null,
        heightCm: height,
        goalFocus,
      });
      applyUser({
        ...updated,
        goalFocus: updated.goalFocus ?? goalFocus,
        coach: updated.coach ?? user?.coach ?? null,
      });
      setMsg("Profil kaydedildi.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Profil kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function addWeight() {
    if (!token) return;
    const kg = Number(weight.replace(",", "."));
    if (!kg || kg < 30 || kg > 300) {
      setError("Geçerli bir kilo gir (30–300 kg).");
      return;
    }
    const fatVal = fat.trim() === "" ? null : Number(fat.replace(",", "."));
    if (fatVal != null && (!Number.isFinite(fatVal) || fatVal < 1 || fatVal > 70)) {
      setError("Yağ oranı 1–70 arasında olmalı.");
      return;
    }
    setMetricBusy(true);
    setError(null);
    setMsg(null);
    try {
      await api.addMetric(token, { weightKg: kg, bodyFatPercent: fatVal });
      setWeight("");
      setFat("");
      setMsg("Ölçüm kaydedildi.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kaydedilemedi.");
    } finally {
      setMetricBusy(false);
    }
  }

  return (
    <Screen style={styles.pad}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Title>Profil</Title>
        <Muted>{user?.email}</Muted>

        <Card style={styles.mt}>
          <Text style={styles.h}>Bilgilerini düzenle</Text>
          <Input placeholder="Ad" value={name} onChangeText={setName} />
          <Input
            keyboardType="decimal-pad"
            placeholder="Boy (cm)"
            value={heightCm}
            onChangeText={setHeightCm}
          />
          <Muted style={styles.chipLabel}>Odak</Muted>
          <View style={styles.chips}>
            {FOCUS_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={goalFocus === opt.value}
                onPress={() => setGoalFocus(opt.value)}
              />
            ))}
          </View>
          <Button label="Profili kaydet" onPress={saveProfile} loading={busy} />
        </Card>

        <Card>
          <Text style={styles.h}>Kilo / yağ ekle</Text>
          <Input
            keyboardType="decimal-pad"
            placeholder="Kilo (ör. 78.5)"
            value={weight}
            onChangeText={setWeight}
          />
          <Input
            keyboardType="decimal-pad"
            placeholder="Yağ % (isteğe bağlı)"
            value={fat}
            onChangeText={setFat}
          />
          <Button label="Ölçümü kaydet" onPress={addWeight} loading={metricBusy} />
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {msg ? <Text style={styles.ok}>{msg}</Text> : null}

        <Card>
          <Text style={styles.label}>API sunucusu</Text>
          <Text style={styles.mono}>{API_URL}</Text>
          <Muted style={styles.mtSm}>
            Telefondan bağlanmak için bilgisayarının yerel IP adresini
            EXPO_PUBLIC_API_URL ile ayarla.
          </Muted>
        </Card>

        <View style={styles.logout}>
          <Button label="Çıkış yap" onPress={signOut} variant="danger" />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingTop: 8 },
  mt: { marginTop: 16 },
  mtSm: { marginTop: 8 },
  h: { fontSize: 16, fontWeight: "700", color: "#064e3b", marginBottom: 8 },
  label: { fontSize: 12, color: "#6b7280", marginTop: 8 },
  chipLabel: { marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  mono: { fontFamily: "SpaceMono", fontSize: 12, color: "#047857" },
  error: { color: "#dc2626", marginBottom: 8 },
  ok: { color: "#047857", marginBottom: 8 },
  logout: { marginTop: 8, marginBottom: 32 },
});
