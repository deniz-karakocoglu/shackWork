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

import { PasswordHints } from "@/components/PasswordHints";
import { Button, Input, Muted, Screen, Title } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { isPasswordStrong } from "@/lib/password-policy";

const currentYear = new Date().getFullYear();

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDay, setBirthDay] = useState("1");
  const [birthMonth, setBirthMonth] = useState("1");
  const [birthYear, setBirthYear] = useState("2000");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!name.trim() || !surname.trim()) {
      setError("Ad ve soyad gerekli.");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("Şifre güçlü değil; aşağıdaki kuralların tamamını sağla.");
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        surname: surname.trim(),
        birthDay: Number(birthDay),
        birthMonth: Number(birthMonth),
        birthYear: Number(birthYear),
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Kayıt oluşturulamadı.");
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
          <Title>Kayıt ol</Title>
          <Muted>16 yaş ve üzeri kullanıcılar için.</Muted>

          <View style={styles.form}>
            <Input placeholder="Ad" value={name} onChangeText={setName} />
            <Input
              placeholder="Soyad"
              value={surname}
              onChangeText={setSurname}
            />
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
              autoComplete="new-password"
            />
            <PasswordHints password={password} />
            <Muted style={styles.birthLabel}>Doğum tarihi (gün / ay / yıl)</Muted>
            <View style={styles.row}>
              <Input
                style={styles.col}
                keyboardType="number-pad"
                placeholder="Gün"
                value={birthDay}
                onChangeText={setBirthDay}
                maxLength={2}
              />
              <Input
                style={styles.col}
                keyboardType="number-pad"
                placeholder="Ay"
                value={birthMonth}
                onChangeText={setBirthMonth}
                maxLength={2}
              />
              <Input
                style={styles.col}
                keyboardType="number-pad"
                placeholder="Yıl"
                value={birthYear}
                onChangeText={(v) =>
                  setBirthYear(v.replace(/[^\d]/g, "").slice(0, 4))
                }
                maxLength={4}
              />
            </View>
            <Muted>
              Örnek yıl aralığı: {currentYear - 80} – {currentYear - 16}
            </Muted>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Kayıt ol" onPress={onSubmit} loading={loading} />
            <Link href="/(auth)/login" style={styles.link}>
              Zaten hesabın var mı? Giriş yap
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
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: "#047857",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  form: { marginTop: 20 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  col: { flex: 1 },
  birthLabel: { marginTop: 4 },
  error: { color: "#dc2626", marginVertical: 8 },
  link: {
    marginTop: 16,
    textAlign: "center",
    color: "#047857",
    fontWeight: "600",
  },
});
