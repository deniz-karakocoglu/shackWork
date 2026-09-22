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
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Giriş yapılamadı.");
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
          <Text style={styles.brand}>shackWork</Text>
          <Title>Giriş yap</Title>
          <Muted>Antrenman ve beslenme takibine devam et.</Muted>

          <View style={styles.form}>
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
            />
            <Input
              secureTextEntry
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Giriş yap" onPress={onSubmit} loading={loading} />
            <Link href="/(auth)/forgot" style={styles.link}>
              Şifremi unuttum
            </Link>
            <Link href="/(auth)/register" style={styles.link}>
              Hesabın yok mu? Kayıt ol
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
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  form: { marginTop: 28 },
  error: { color: "#dc2626", marginBottom: 8 },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#047857",
    fontWeight: "600",
  },
});
