import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { colors } from "@/constants/theme";
import ThemedText from "@/components/ui/themed-text";
import { CloseIcon } from "@/components/ui/icons";
import { changePassword, MIN_PASSWORD_LENGTH } from "@/data/auth";

type ChangePasswordModalProps = {
  visible: boolean;
  /** Dipanggil saat pengguna menutup modal (Selesai / Batal / backdrop). */
  onClose: () => void;
};

/**
 * Modal "Ganti Password" — alur sederhana: cukup password baru +
 * konfirmasi (tanpa password lama, sesuai arsitektur autentikasi lokal).
 * Password baru divalidasi (minimum MIN_PASSWORD_LENGTH karakter & cocok),
 * lalu disimpan sebagai hash untuk akun yang sedang login saja.
 */
export default function ChangePasswordModal({
  visible,
  onClose,
}: ChangePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** Bersihkan form — dipanggil di semua jalur menutup modal,
   * sehingga modal selalu terbuka dalam kondisi segar. */
  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (submitting) {
      return;
    }
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await changePassword(password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.card} onPress={() => undefined}>
            <View style={styles.headerRow}>
              <ThemedText variant="cardTitle">Ganti Password</ThemedText>
              <Pressable
                hitSlop={8}
                onPress={handleClose}
                accessibilityLabel="Tutup ganti password"
                accessibilityRole="button"
              >
                <CloseIcon size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {success ? (
              <View style={styles.successBanner} accessibilityRole="alert">
                <ThemedText style={styles.successText}>
                  Password berhasil diubah. Gunakan password baru untuk login
                  berikutnya.
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.fieldWrap}>
                  <ThemedText variant="caption">Password Baru</ThemedText>
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError(null);
                    }}
                    style={styles.input}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    editable={!submitting}
                    accessibilityLabel="Password Baru"
                  />
                </View>
                <View style={styles.fieldWrap}>
                  <ThemedText variant="caption">
                    Konfirmasi Password Baru
                  </ThemedText>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error) setError(null);
                    }}
                    style={styles.input}
                    placeholder="Ulangi password baru"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    editable={!submitting}
                    accessibilityLabel="Konfirmasi Password Baru"
                  />
                </View>
              </>
            )}

            {error ? (
              <ThemedText style={styles.errorText} accessibilityRole="alert">
                {error}
              </ThemedText>
            ) : null}

            {success ? (
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Selesai"
              >
                <ThemedText style={styles.primaryButtonText}>Selesai</ThemedText>
              </Pressable>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  onPress={handleClose}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Batal ganti password"
                >
                  <ThemedText style={styles.cancelButtonText}>Batal</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void handleSave();
                  }}
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                    submitting && styles.buttonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Simpan Password"
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <ThemedText style={styles.primaryButtonText}>
                      Simpan Password
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 12, 22, 0.7)",
  },
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.authError,
  },
  successBanner: {
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
  primaryButton: {
    flex: 1,
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
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
