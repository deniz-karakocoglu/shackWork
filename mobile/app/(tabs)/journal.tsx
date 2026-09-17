import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { Button, Card, Input, Muted, Screen } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { addDays, formatLogDateHuman, todayLogDate } from "@/lib/date";
import type { DayLog } from "@/lib/types";

function parseReport(raw: string | null | undefined) {
  const text = raw?.trim();
  if (!text) return [];
  const blocks = text.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split("\n");
    const first = lines[0]?.trim() ?? "";
    const isTitle = first.startsWith("**") && first.endsWith("**");
    const title = isTitle ? first.replace(/^\*\*|\*\*$/g, "") : "";
    const body = isTitle ? lines.slice(1).join("\n").trim() : block;
    return { title, body };
  });
}

export default function JournalScreen() {
  const { token } = useAuth();
  const [logDate, setLogDate] = useState(todayLogDate);
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [training, setTraining] = useState("");
  const [meals, setMeals] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  const selected = useMemo(
    () => logs.find((l) => l.logDate === logDate) ?? null,
    [logs, logDate],
  );
  const sections = useMemo(
    () => parseReport(selected?.aiReport),
    [selected?.aiReport],
  );
  const isToday = logDate === todayLogDate();

  const applyLog = useCallback((found: DayLog | null) => {
    setTraining(found?.trainingText ?? "");
    setMeals(found?.mealsText ?? "");
    setNotes(found?.notes ?? "");
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const all = await api.dayLogs(token);
      setLogs(all);
      const found = all.find((l) => l.logDate === logDate) ?? null;
      applyLog(found);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Günlük yüklenemedi.");
    }
  }, [token, logDate, applyLog]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function shiftDay(delta: number) {
    const next = addDays(logDate, delta);
    if (next > todayLogDate()) return;
    setLogDate(next);
  }

  async function save() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await api.upsertDayLog(token, {
        logDate,
        trainingText: training,
        mealsText: meals,
        notes,
      });
      setLogs((prev) => {
        const rest = prev.filter((l) => l.logDate !== logDate);
        return [saved, ...rest];
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function generateReport() {
    if (!token) return;
    setReportBusy(true);
    setError(null);
    try {
      const saved = await api.upsertDayLog(token, {
        logDate,
        trainingText: training,
        mealsText: meals,
        notes,
      });
      const res = await api.generateDayReport(token, logDate);
      const updated = res.log ?? { ...saved, aiReport: res.report };
      setLogs((prev) => {
        const rest = prev.filter((l) => l.logDate !== logDate);
        return [updated, ...rest];
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Rapor üretilemedi.");
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <Screen style={styles.pad}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.nav}>
          <Pressable onPress={() => shiftDay(-1)} style={styles.navBtn}>
            <Text style={styles.navTxt}>‹ Önceki</Text>
          </Pressable>
          <View style={styles.navCenter}>
            <Text style={styles.dateTitle}>{formatLogDateHuman(logDate)}</Text>
            <Muted>{isToday ? "Bugün" : logDate}</Muted>
          </View>
          <Pressable
            onPress={() => shiftDay(1)}
            disabled={isToday}
            style={[styles.navBtn, isToday && styles.navDisabled]}
          >
            <Text style={[styles.navTxt, isToday && styles.navDisabledTxt]}>
              Sonraki ›
            </Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Card style={styles.mt}>
          <Text style={styles.h}>Antrenman</Text>
          <Input
            multiline
            placeholder="Bugün ne yaptın?"
            value={training}
            onChangeText={setTraining}
            style={styles.multiline}
          />
        </Card>

        <Card>
          <Text style={styles.h}>Beslenme</Text>
          <Input
            multiline
            placeholder="Öğünler, kalori notları..."
            value={meals}
            onChangeText={setMeals}
            style={styles.multiline}
          />
        </Card>

        <Card>
          <Text style={styles.h}>Not</Text>
          <Input
            multiline
            placeholder="Ek notlar"
            value={notes}
            onChangeText={setNotes}
            style={styles.multiline}
          />
        </Card>

        <Button label="Günü kaydet" onPress={save} loading={busy} />
        <View style={styles.gap} />
        <Button
          label="AI rapor üret"
          onPress={generateReport}
          loading={reportBusy}
          variant="secondary"
        />

        {sections.length > 0 ? (
          <Card style={styles.mt}>
            <Text style={styles.h}>AI raporu</Text>
            {sections.map((section, idx) => (
              <View key={`${section.title}-${idx}`} style={styles.section}>
                {section.title ? (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                ) : null}
                <Text style={styles.body}>{section.body}</Text>
              </View>
            ))}
          </Card>
        ) : selected ? (
          <Muted style={styles.mt}>Bu gün için henüz AI raporu yok.</Muted>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingTop: 8 },
  mt: { marginTop: 12 },
  gap: { height: 8 },
  h: { fontSize: 16, fontWeight: "700", color: "#064e3b", marginBottom: 8 },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  body: { fontSize: 14, lineHeight: 21, color: "#18181b" },
  error: { color: "#dc2626", marginVertical: 8 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: { paddingVertical: 8, paddingHorizontal: 4, minWidth: 72 },
  navCenter: { flex: 1, alignItems: "center" },
  dateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#064e3b",
    textAlign: "center",
    textTransform: "capitalize",
  },
  navTxt: { color: "#047857", fontWeight: "700" },
  navDisabled: { opacity: 0.35 },
  navDisabledTxt: { color: "#9ca3af" },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
    marginBottom: 4,
  },
});
