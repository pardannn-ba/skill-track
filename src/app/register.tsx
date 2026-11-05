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
import { Redirect, useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import SkillTrackLogo from "@/components/auth/skilltrack-logo";
import AuthInput from "@/components/auth/auth-input";
import ThemedText from "@/components/ui/themed-text";
import { LockIcon, MailIcon, UserIcon } from "@/components/ui/icons";
import { register } from "@/data/auth";
import { useAuthState } from "@/hooks/use-auth-state";


/**
 * Halaman Register SkillTrack.
 * Akun disimpan menggunakan Supabase Auth.
 * Setelah mendaftar, pengguna diarahkan ke halaman Login.
 */

export default function RegisterScreen() {
  const router = useRouter();
  const { session, ready } = useAuthState();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sudah login valid → tidak perlu membuka register.
  if (ready && session) {
    return <Redirect href="/(tabs)" />;
  }


  const handleRegister = async () => {
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const result = await register({
        fullName,
        username,
        email,
        password,
        confirmPassword,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace({
        pathname: "/login",
        params: { registered: email.trim() },
      });
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
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
          {/* Header identik dengan halaman Login */}
          <View style={styles.header}>
            <SkillTrackLogo size={190} />
            <ThemedText style={styles.title}>Selamat Datang</ThemedText>
            <ThemedText style={styles.subtitle}>
              Lacak progres, Capai skill impianmu
            </ThemedText>
          </View>

          {/* Panel bawah */}
          <View style={styles.panel}>
            <ThemedText style={styles.panelTitle}>Buat Akun</ThemedText>

            <View style={styles.form}>
              <AuthInput
                icon={UserIcon}
                placeholder="Nama lengkap"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (error) setError(null);
                }}
                autoCapitalize="words"
                textContentType="name"
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel="Nama lengkap"
              />
              <AuthInput
                icon={UserIcon}
                placeholder="Username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel="Username"
              />

              <AuthInput
                icon={MailIcon}
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel="Email"
              />
              <AuthInput
                icon={LockIcon}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel="Password"
              />

              <AuthInput
                icon={LockIcon}
                placeholder="Konfirmasi password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                editable={!submitting}
                accessibilityLabel="Konfirmasi password"
              />


              {error ? (
                <ThemedText style={styles.errorText} accessibilityRole="alert">
                  {error}
                </ThemedText>
              ) : null}

              <Pressable
                onPress={() => {
                  void handleRegister();
                }}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.registerButton,
                  pressed && styles.registerButtonPressed,
                  submitting && styles.registerButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Daftar"
              >
                {submitting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <ThemedText style={styles.registerButtonText}>
                    Daftar
                  </ThemedText>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                // Kembali ke halaman Login (riwayat: login → register).
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/login");
                }
              }}
              disabled={submitting}
              style={styles.footerLink}
              accessibilityRole="link"
              accessibilityLabel="Kembali ke halaman login"
            >
              <ThemedText style={styles.footerText}>
                Sudah punya akun?{" "}
                <ThemedText style={styles.footerLinkBold}>Login</ThemedText>
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
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 4,
    backgroundColor: colors.authBackground,
  },
  title: {
    marginTop: 18,
    fontSize: 26,
    lineHeight: 32,
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
    flex: 1,
    backgroundColor: colors.authPanel,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
  },
  panelTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 24,
  },
  form: {
    gap: 15,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.authError,
  },
  registerButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.authButton,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonPressed: {
    opacity: 0.85,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },
  footerLink: {
    marginTop: 24,
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
