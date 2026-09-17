import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import { useTheme } from "@/components/ui";
import type { Metric } from "@/lib/types";

const WIDTH = 320;
const HEIGHT = 160;
const PAD = 16;

export function WeightChart({ metrics }: { metrics: Metric[] }) {
  const c = useTheme();
  const points = useMemo(
    () => [...metrics].reverse().filter((m) => Number.isFinite(m.weightKg)),
    [metrics],
  );

  if (points.length === 0) {
    return (
      <Text style={{ color: c.textMuted }}>
        Grafik için henüz ölçüm yok. Profil sekmesinden kilo ekle.
      </Text>
    );
  }

  if (points.length === 1) {
    return (
      <Text style={{ color: c.textMuted }}>
        Trend için en az iki ölçüm gerekir. Son kilo: {points[0].weightKg} kg.
      </Text>
    );
  }

  const weights = points.map((p) => p.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * (WIDTH - PAD * 2);
    const y = HEIGHT - PAD - ((p.weightKg - min) / span) * (HEIGHT - PAD * 2);
    return { x, y, weight: p.weightKg };
  });
  const polyline = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const last = coords[coords.length - 1];
  const first = coords[0];

  return (
    <View>
      <Svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        accessibilityLabel="Kilo grafiği"
      >
        <Polyline
          points={polyline}
          fill="none"
          stroke={c.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={last.x} cy={last.y} r={4} fill={c.primary} />
      </Svg>
      <View style={styles.legend}>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>
          {first.weight} → {last.weight} kg
        </Text>
        <Text style={{ color: c.primary, fontWeight: "700" }}>
          {last.weight} kg
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
});
