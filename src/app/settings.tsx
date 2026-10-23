import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import ThemedText from "@/components/themed-text";
import ChangePasswordModal from "@/components/change-password-modal";
import { ChevronLeftIcon, LogOutIcon } from "@/components/icons";
import { logout, updateProfile } from "@/data/auth";
import { useAuthState } from "@/hooks/use-auth-state";

/** Satu baris informasi akun (read-only). */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText variant="caption">{label}</ThemedText>
      <ThemedText variant="body" style={styles.infoValue} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

/**
 * Halaman Pengaturan — dibuka dari ikon roda gigi di profil
 * (Home/Dashboard & tab Profil).
 * Berisi: A) Informasi Akun (+ Edit Profil inline) dan
 * B) Keamanan Akun (Ganti Password modal & Keluar).
 * Data diambil dari sesi login aktif sehingga selalu milik akun sendiri.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { session, ready } = useAuthState();

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Pengaman tambahan: halaman ini hanya valid saat login.
  if (ready && !session) {
    return <Redirect href="/login" />;
  }

  const fullName = session?.fullName ?? "";
  const username = session?.username ?? "";
  const email = session?.email?.trim() ?? "";

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const openEdit = () => {
    setNameDraft(fullName);
    setUsernameDraft(username);
    setFormError(null);
    setSavedBanner(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormError(null);
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }
    setFormError(null);
    setSavedBanner(false);
    setSaving(true);
    try {
      const result = await updateProfile({
        fullName: nameDraft,
        username: usernameDraft,
      });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      // Sesi ikut diperbarui di auth store → Home & tab Profil langsung
      // menampilkan nama/username terbaru (subscribeSession di useAuthState).
      setEditing(false);
      setSavedBanner(true);
    } finally {
      setSaving(false);
    }
  };

  /** Akhiri sesi login → guard Stack.Protected mengalihkan ke Login. */
  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      {/* Top bar: tombol kembali + judul */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={10}
          onPress={goBack}
          accessibilityLabel="Kembali ke halaman sebelumnya"
          accessibilityRole="button"
        >
          <ChevronLeftIcon size={26} color={colors.text} />
        </Pressable>
        <ThemedText variant="cardTitle">Pengaturan</ThemedText>
        {/* Spacer agar judul tetap di tengah */}
        <View style={styles.topBarSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {savedBanner ? (
            <View style={styles.successBanner} accessibilityRole="alert">
              <ThemedText style={styles.successText}>
                Profil berhasil diperbarui.
              </ThemedText>
            </View>
          ) : null}

          {/* A. Informasi Akun */}
          <View style={styles.card}>
            <ThemedText variant="cardTitle">Informasi Akun</ThemedText>

            {!editing ? (
              <>
                <InfoRow label="Nama lengkap" value={fullName || "-"} />
                <InfoRow label="Username" value={username || "-"} />
                <InfoRow label="Email" value={email || "Tidak tersedia"} />
                <Pressable
                  onPress={openEdit}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit Profil"
                >
                  <ThemedText style={styles.primaryButtonText}>
                    Edit Profil
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.fieldWrap}>
                  <ThemedText variant="caption">Nama lengkap</ThemedText>
                  <TextInput
                    value={nameDraft}
                    onChangeText={setNameDraft}
                    style={styles.input}
                    placeholder="Masukkan nama lengkap"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                    textContentType="name"
                    editable={!saving}
                    accessibilityLabel="Nama lengkap"
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <ThemedText variant="caption">Username</ThemedText>
                  <TextInput
                    value={usernameDraft}
                    onChangeText={setUsernameDraft}
                    style={styles.input}
                    placeholder="Masukkan username"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!saving}
                    accessibilityLabel="Username"
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <ThemedText variant="caption">Email</ThemedText>
                  <View style={styles.readonlyBox}>
                    <ThemedText variant="body" numberOfLines={1}>
                      {email || "Tidak tersedia"}
                    </ThemedText>
                  </View>
                  <ThemedText variant="caption" style={styles.hint}>
                    Email tidak dapat diubah karena dipakai sebagai identitas
                    login.
                  </ThemedText>
                </View>

                {formError ? (
                  <ThemedText
                    style={styles.errorText}
                    accessibilityRole="alert"
                  >
                    {formError}
                  </ThemedText>
                ) : null}

                <View style={styles.actions}>
                  <Pressable
                    onPress={cancelEdit}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.cancelButton,
                      pressed && styles.buttonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Batal edit profil"
                  >
                    <ThemedText style={styles.cancelButtonText}>
                      Batal
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void handleSave();
                    }}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                      saving && styles.buttonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Simpan Perubahan"
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>
                        Simpan Perubahan
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {/* B. Keamanan Akun */}
          <View style={styles.card}>
            <ThemedText variant="cardTitle">Keamanan Akun</ThemedText>
            <Pressable
              onPress={() => setPasswordVisible(true)}
              style={({ pressed }) => [
                styles.outlineButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ganti Password"
            >
              <ThemedText style={styles.outlineButtonText}>
                Ganti Password
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                void handleLogout();
              }}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Keluar dari akun"
            >
              <LogOutIcon size={18} color={colors.authError} />
              <ThemedText style={styles.logoutText}>Keluar</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Ganti password (tanpa password lama — alur sederhana lokal) */}
      <ChangePasswordModal
        visible={passwordVisible}
        onClose={() => setPasswordVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarSpacer: {
    width: 26,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 14,
  },
  infoRow: {
    gap: 3,
  },
  infoValue: {
    color: colors.text,
  },
  fieldWrap: {
    gap: 8,
  },
  input: {
    backgroundColor: colors.blueLayer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  readonlyBox: {
    backgroundColor: colors.blueLayer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    opacity: 0.75,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.authError,
  },
  successBanner: {
    marginTop: 16,
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
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.text,
  },
  outlineButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.authInputBorder,
    backgroundColor: colors.blueLayer,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.text,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.authInputBorder,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.authInputBorder,
    backgroundColor: colors.card,
  },
  logoutText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.authError,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
