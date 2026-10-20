import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import SkillTrackLogo from "@/components/skilltrack-logo";
import AuthInput from "@/components/auth-input";
import ThemedText from "@/components/themed-text";
import { LockIcon, MailIcon } from "@/components/icons";
import { login } from "@/data/auth";
import { useAuthState } from "@/hooks/use-auth-state";

/**
 * Halaman Login — gerbang masuk SkillTrack (sesuai screenshot referensi).
 * Autentikasi masih LOKAL (lihat src/data/auth.ts): akun demo
 * `admin123` / `admin123` atau akun hasil register.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { session, ready } = useAuthState();
  // Parameter `registered` dikirim halaman Register sebagai konfirmasi sukses.
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const registeredName = typeof registered === "string" ? registered : "";

  // Prefill identifier dari halaman Register (langsung dari param, tanpa effect).
  const [identifier, setIdentifier] = useState(registeredName);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Banner "pendaftaran berhasil" disembunyikan saat pengguna mulai mengetik.
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const justRegistered = registeredName.length > 0 && !bannerDismissed;

  // Sudah login valid → jangan tampilkan login lagi.
  if (ready && session) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    // Cegah proses ganda selagi login berjalan.
    if (submitting) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(identifier, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Login berhasil: komponen akan render <Redirect href="/(tabs)" />
      // di render berikutnya, dan guard Stack.Protected di _layout
      // menghapus riwayat halaman login sehingga tombol kembali
      // tidak bisa melewati autentikasi.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header: logo + judul + subtitle, rata tengah */}
          <View style={styles.header}>
            <SkillTrackLogo size={88} />
            <ThemedText style={styles.title}>Selamat Datang</ThemedText>
            <ThemedText style={styles.subtitle}>
              Lacak progres, Capai skill impianmu
            </ThemedText>
          </View>

          {/* Panel bawah: sudut atas membulat besar */}
          <View style={styles.panel}>
            <ThemedText style={styles.panelTitle}>Masuk Ke Akun</ThemedText>

            {justRegistered ? (
              <View style={styles.successBanner} accessibilityRole="alert">
                <ThemedText style={styles.successText}>
                  Pendaftaran berhasil. Silakan masuk dengan akun baru kamu.
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.form}>
              <AuthInput
                icon={MailIcon}
                placeholder="Email atau Username"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  setBannerDismissed(true);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel="Email atau Username"
              />
              <AuthInput
                icon={LockIcon}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setBannerDismissed(true);
                  if (error) setError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => {
                  void handleLogin();
                }}
                editable={!submitting}
                accessibilityLabel="Password"
              />

              {error ? (
                <ThemedText style={styles.errorText} accessibilityRole="alert">
                  {error}
                </ThemedText>
              ) : null}

              <Pressable
                onPress={() => {
                  void handleLogin();
                }}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                  submitting && styles.loginButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Masuk"
              >
                {submitting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <ThemedText style={styles.loginButtonText}>Masuk</ThemedText>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() => router.push("/register")}
              disabled={submitting}
              style={styles.footerLink}
              accessibilityRole="link"
              accessibilityLabel="Buka halaman register"
            >
              <ThemedText style={styles.footerText}>
                Belum punya akun?{" "}
                <ThemedText style={styles.footerLinkBold}>Register</ThemedText>
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.authBackground,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.authBackground,
  },
  header: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 6,
    backgroundColor: colors.authBackground,
  },
  title: {
    marginTop: 22,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  panel: {
    flex: 1, // menempati area bawah layar
    backgroundColor: colors.authPanel,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
  },
  panelTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 26,
  },
  form: {
    gap: 16,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.authError,
  },
  successBanner: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F8A63",
    backgroundColor: "#0E2E27",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#4ADE9E",
  },
  loginButton: {
    marginTop: 10,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.authButton,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonPressed: {
    opacity: 0.85,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
  footerLink: {
    marginTop: 26,
    alignItems: "center",
    paddingVertical: 6,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  footerLinkBold: {
    fontWeight: "700",
    color: colors.text,
  },
});
