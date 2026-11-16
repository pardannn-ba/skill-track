
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function ResetPasswordScreen() {
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const processed = useRef(false);

  useEffect(() => {
    let active = true;

    const handleRecoveryUrl = async (url: string | null) => {
      if (!url || processed.current) return;

      processed.current = true;

      try {
        const query = url.split("?")[1]?.split("#")[0] ?? "";
        const fragment = url.split("#")[1] ?? "";

        const params = new URLSearchParams(`${query}&${fragment}`);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          throw new Error(
            "Token pemulihan tidak ditemukan. Silakan minta email reset password yang baru."
          );
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;

        if (active) {
          setValidLink(true);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Link reset password tidak valid atau sudah kedaluwarsa."
          );
          setValidLink(false);
        }
      } finally {
        if (active) setChecking(false);
      }
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      void handleRecoveryUrl(window.location.href);
    } else {
      void Linking.getInitialURL().then(handleRecoveryUrl);

      const subscription = Linking.addEventListener("url", ({ url }) => {
        void handleRecoveryUrl(url);
      });

      return () => {
        active = false;
        subscription.remove();
      };
    }

    return () => {
      active = false;
    };
  }, []);

  const handleUpdatePassword = async () => {
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      Alert.alert(
        "Berhasil",
        "Password berhasil diperbarui. Silakan login menggunakan password baru."
      );

      router.replace("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui password. Coba lagi."
      );
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2680FF" />
        <Text style={styles.info}>Memeriksa link pemulihan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>

        {validLink ? (
          <>
            <Text style={styles.subtitle}>
              Buat password baru untuk akun SkillTrack kamu.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Password baru"
              placeholderTextColor="#91A9C4"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Konfirmasi password baru"
              placeholderTextColor="#91A9C4"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.button, saving && styles.disabled]}
              onPress={handleUpdatePassword}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Simpan Password Baru</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.error}>
              {error || "Link pemulihan tidak valid."}
            </Text>

            <Text style={styles.subtitle}>
              Silakan minta email pemulihan password yang baru.
            </Text>

            <Pressable
              style={styles.button}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.buttonText}>Kembali ke Login</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06152F",
    justifyContent: "center",
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#06152F",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#0A203B",
    padding: 24,
    borderRadius: 18,
    gap: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#A9C1DF",
    fontSize: 14,
    lineHeight: 21,
  },
  info: {
    color: "#FFFFFF",
    marginTop: 16,
  },
  input: {
    backgroundColor: "#07182E",
    borderWidth: 1,
    borderColor: "#294969",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 15,
  },
  button: {
    backgroundColor: "#2679F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  error: {
    color: "#FF7777",
    fontSize: 14,
    lineHeight: 20,
  },
});
