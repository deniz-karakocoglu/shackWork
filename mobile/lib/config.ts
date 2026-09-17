import Constants from "expo-constants";

/**
 * API tabanı — geliştirmede bilgisayarının yerel IP'si:
 * EXPO_PUBLIC_API_URL=http://192.168.1.XX:3000
 *
 * Android emülatör: http://10.0.2.2:3000
 * iOS simülatör / Expo web: http://localhost:3000
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(
    /\/$/,
    "",
  ) ??
  "http://localhost:3000";
