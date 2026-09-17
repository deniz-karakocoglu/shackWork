import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/components/ui";
import {
  evaluatePassword,
  isPasswordStrong,
} from "@/lib/password-policy";

export function PasswordHints({
  password,
  confirm,
  showConfirmMatch,
}: {
  password: string;
  confirm?: string;
  showConfirmMatch?: boolean;
}) {
  const c = useTheme();
  const checks = evaluatePassword(password);
  const allOk = isPasswordStrong(password);
  const matchOk =
    !showConfirmMatch ||
    confirm === undefined ||
    confirm.length === 0 ||
    password === confirm;

  return (
    <View style={[styles.box, { borderColor: c.border, backgroundColor: c.surface }]}>
      <Text
        style={[
          styles.heading,
          { color: allOk ? c.primary : c.textMuted },
        ]}
      >
        {allOk ? "Şifre güçlü görünüyor" : "Güçlü şifre için:"}
      </Text>
      {checks.map((item) => (
        <Text
          key={item.id}
          style={{ color: item.passed ? c.primary : c.textMuted, marginBottom: 4 }}
        >
          {item.passed ? "✓" : "○"} {item.label}
        </Text>
      ))}
      {showConfirmMatch && confirm !== undefined && confirm.length > 0 ? (
        <Text style={{ color: matchOk ? c.primary : "#d97706" }}>
          {matchOk ? "✓" : "○"} Şifreler aynı
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  heading: {
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 13,
  },
});
