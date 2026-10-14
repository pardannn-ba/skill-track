import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  useEffect(() => {
    // Pastikan navigation bar Android & root view juga navy, bukan putih.
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, []);

  return (
    <>
      {/* Ikon status bar terang agar terbaca di atas background navy */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          // Header bawaan Stack (bar putih bertuliskan "(tabs)" + ikon gear)
          // dinonaktifkan; setiap tab sudah punya UI-nya sendiri.
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
