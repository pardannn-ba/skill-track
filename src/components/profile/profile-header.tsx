import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/constants/theme";
import ThemedText from "@/components/ui/themed-text";
import { SettingsIcon } from "@/components/ui/icons";
import { initialsFromName } from "@/data/profile";

type ProfileHeaderProps = {
  /** Nama lengkap dari akun yang sedang login. */
  fullName: string;
  /** Username (atau email) di bawah nama — lihat profileSubtitle(). */
  subtitle: string;
  /** Buka halaman Pengaturan (ikon roda gigi). */
  onSettingsPress: () => void;
  /** Spasi bawah opsional agar cocok dipakai di Home maupun tab Profil. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Header profil reusable (avatar inisial + nama + username/email + ikon
 * pengaturan). Dipakai di halaman Home/Dashboard dan tab Profil agar
 * tampilan profil selalu konsisten dengan akun yang sedang login.
 */
export default function ProfileHeader({
  fullName,
  subtitle,
  onSettingsPress,
  style,
}: ProfileHeaderProps) {
  const displayName = fullName.trim();
  return (
    <View style={[styles.header, style]}>
      <View style={styles.avatar}>
        <ThemedText style={styles.avatarText}>
          {initialsFromName(displayName)}
        </ThemedText>
      </View>
      <View style={styles.headerInfo}>
        <ThemedText variant="cardTitle" numberOfLines={1}>
          {displayName || "Pelajar"}
        </ThemedText>
        <ThemedText variant="caption" color="#7FA3D9" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <Pressable
        hitSlop={10}
        onPress={onSettingsPress}
        accessibilityLabel="Buka pengaturan profil"
        accessibilityRole="button"
      >
        <SettingsIcon size={24} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
    paddingBottom: 18,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
});
