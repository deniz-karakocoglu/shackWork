import { Link } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button, Input, Muted, Screen, Title } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export default function ForgotScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      setMessage(
        res.message ??
          "Eğer e-posta kayıtlıysa sıfırlama bağlantısı gönderildi.",
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "İstek gönderilemedi.");
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
          <Title>Şifremi unuttum</Title>
          <Muted>
            Kayıtlı e-postana sıfırlama bağlantısı gönderilir. Bağlantı 1 saat
            geçerlidir.
          </Muted>
          <View style={styles.form}>
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.ok}>{message}</Text> : null}
            <Button
              label="Sıfırlama bağlantısı gönder"
              onPress={onSubmit}
              loading={loading}
            />
            <Muted style={styles.hint}>
              E-postadaki web linkini açabilir veya uygulamada «Şifre sıfırla»
              ekranına token yapıştırabilirsin.
            </Muted>
            <Link href="/(auth)/reset" style={styles.link}>
              Token ile şifre sıfırla
            </Link>
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
  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 },
  form: { marginTop: 24 },
  error: { color: "#dc2626", marginBottom: 8 },
  ok: { color: "#047857", marginBottom: 8 },
  hint: { marginTop: 12 },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#047857",
    fontWeight: "600",
  },
});
