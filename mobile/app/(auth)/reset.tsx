import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PasswordHints } from "@/components/PasswordHints";
import { Button, Input, Muted, Screen, Title } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { isPasswordStrong } from "@/lib/password-policy";

export default function ResetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const tokenFromLink = useMemo(() => {
    const raw = params.token;
    if (Array.isArray(raw)) return raw[0] ?? "";
    return raw ?? "";
  }, [params.token]);

  const [token, setToken] = useState(tokenFromLink);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromLink) setToken(tokenFromLink);
  }, [tokenFromLink]);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Bağlantı geçersiz; e-postadaki sıfırlama linkini kullan.");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("Şifre güçlü değil; aşağıdaki kuralların tamamını sağla.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler uyuşmuyor.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.resetPassword(trimmed, password);
      setMessage(res.message ?? "Şifre güncellendi. Artık giriş yapabilirsin.");
      setPassword("");
      setConfirm("");
      setTimeout(() => router.replace("/(auth)/login"), 800);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Şifre güncellenemedi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Title>Şifre sıfırla</Title>
          <Muted>E-postadaki bağlantıdan gelen token ile yeni şifreni belirle.</Muted>
          <View style={styles.form}>
            <Input
              placeholder="Sıfırlama tokenı"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              secureTextEntry
              placeholder="Yeni şifre"
              value={password}
              onChangeText={setPassword}
              autoComplete="new-password"
            />
            <PasswordHints
              password={password}
              confirm={confirm}
              showConfirmMatch
            />
            <Input
              secureTextEntry
              placeholder="Yeni şifre (tekrar)"
              value={confirm}
              onChangeText={setConfirm}
              autoComplete="new-password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.ok}>{message}</Text> : null}
            <Button
              label="Şifreyi güncelle"
              onPress={onSubmit}
              loading={loading}
            />
            <Link href="/(auth)/login" style={styles.link}>
              Girişe dön
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingVertical: 24 },
  form: { marginTop: 24 },
  error: { color: "#dc2626", marginBottom: 8 },
  ok: { color: "#047857", marginBottom: 8 },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#047857",
    fontWeight: "600",
  },
});
