import { Stack } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function AuthLayout() {
  const scheme = useColorScheme() ?? "light";
  const c = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.primaryDark,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Giriş" }} />
      <Stack.Screen name="register" options={{ title: "Kayıt" }} />
      <Stack.Screen name="forgot" options={{ title: "Şifremi unuttum" }} />
      <Stack.Screen name="reset" options={{ title: "Şifre sıfırla" }} />
    </Stack>
  );
}
