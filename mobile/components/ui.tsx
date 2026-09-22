import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export function useTheme() {
  const scheme = useColorScheme() ?? "light";
  return Colors[scheme];
}

export function Screen({
  children,
  style,
  ...props
}: ViewProps & { children: ReactNode }) {
  const c = useTheme();
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: c.background }, style]}
      edges={["top", "left", "right"]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewProps["style"];
}) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <Text style={[styles.title, { color: c.primaryDark }]}>{children}</Text>;
}

export function Muted({
  children,
  style,
}: {
  children: ReactNode;
  style?: TextInputProps["style"];
}) {
  const c = useTheme();
  return (
    <Text style={[styles.muted, { color: c.textMuted }, style]}>{children}</Text>
  );
}

export function Input(props: TextInputProps) {
  const c = useTheme();
  return (
    <TextInput
      placeholderTextColor={c.textMuted}
      style={[
        styles.input,
        { color: c.text, borderColor: c.border, backgroundColor: c.background },
        props.style,
      ]}
      {...props}
    />
  );
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const c = useTheme();
  const bg =
    variant === "primary"
      ? c.primary
      : variant === "danger"
        ? c.danger
        : c.surface;
  const fg = variant === "secondary" ? c.primary : "#ffffff";
  const isDisabled = Boolean(loading || disabled);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: variant === "secondary" ? c.border : bg,
          opacity: pressed || isDisabled ? 0.7 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? c.primary : c.background,
          borderColor: selected ? c.primary : c.border,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? "#ffffff" : c.text,
          fontWeight: "600",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.empty, { borderColor: c.border }]}>
      <Text style={{ color: c.textMuted, textAlign: "center", lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  muted: { fontSize: 14, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 4,
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
});
