import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useCallback, useEffect, useState } from "react";
import { colors } from "@/constants/theme";
import AuthSplash from "@/components/auth-splash";
import { useAuthState } from "@/hooks/use-auth-state";

// Tahan splash native (app.json) sampai splash animasi JS siap tampil,
// agar transisi dari splash bawaan Expo ke splash animasi tidak berkedip.
void SplashScreen.preventAutoHideAsync().catch(() => {
  // Abaikan jika sudah dipanggil modul lain.
});

export default function RootLayout() {
  const { session, ready } = useAuthState();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Pastikan navigation bar Android & root view juga navy, bukan putih.
    void SystemUI.setBackgroundColorAsync(colors.background);
    // Splash native disembunyikan setelah frame pertama tampil;
    // splash animasi JS mengambil alih di layar yang sama warnanya.
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <>
      {/* Ikon status bar terang agar terbaca di atas background navy */}
      <StatusBar style="light" />
      {/*
        Gerbang autentikasi:
        - Group guard={session}  → hanya bisa diakses saat login valid.
        - Group guard={!session} → hanya halaman login/register saat belum login.
        Saat guard berubah (login/logout), riwayat halaman di group lama
        dibuang sehingga tombol kembali tidak bisa melewati login.
        Selama sesi masih dibaca (ready=false) session masih null dan
        navigator menampilkan halaman login — tampilan ditutup splash
        animasi sampai animasi & pembacaan sesi selesai.
      */}
      <Stack
        screenOptions={{
          // Header bawaan Stack (bar putih bertuliskan "(tabs)" + ikon gear)
          // dinonaktifkan; setiap tab sudah punya UI-nya sendiri.
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={session !== null}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="activity-history" />
          <Stack.Screen name="material-detail" />
          <Stack.Screen name="skill-detail" />
        </Stack.Protected>
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
      </Stack>

      {/* Splash animasi pembuka — menutup navigator sampai animasi & sesi selesai. */}
      {!splashDone ? <AuthSplash ready={ready} onDone={handleSplashDone} /> : null}
    </>
  );
}
