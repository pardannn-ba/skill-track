import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { Skill } from "@/data/skills";
import SubjectIcon from "@/components/ui/subject-icon";
import ThemedText from "@/components/ui/themed-text";

/** Status belajar skill untuk kartu di Explore. */
export type SkillCardStatus = "not-started" | "in-progress" | "completed";

export type SkillCardProps = {
  skill: Skill;
  /** Status belajar dari store progres (default: belum dimulai). */
  status?: SkillCardStatus;
  /** Persen progress untuk skill yang sedang dipelajari. */
  percent?: number;
  /** Tekan kartu = buka Learning Path skill. */
  onPress: (skill: Skill) => void;
  /** Tekan tombol = Mulai/Lanjutkan Belajar (mulai skill bila belum dimulai). */
  onAction?: (skill: Skill) => void;
};

/** Label & teks tombol sesuai status (screenshot: "Mulai Belajar" biru). */
function actionLabel(
  status: SkillCardStatus,
): { label: string; style: "actionButton" | "doneButton" } {
  if (status === "in-progress") {
    return { label: "Lanjutkan Belajar", style: "actionButton" };
  }
  if (status === "completed") {
    return { label: "Selesai", style: "doneButton" };
  }
  return { label: "Mulai Belajar", style: "actionButton" };
}

/**
 * Kartu skill pada halaman Explore: kotak ikon kiri, nama,
 * deskripsi, badge level kapsul hijau turquoise, status belajar
 * (caption), tombol aksi, dan chevron kanan.
 */
export default function SkillCard({
  skill,
  status = "not-started",
  percent = 0,
  onPress,
  onAction,
}: SkillCardProps) {
  const action = actionLabel(status);
  return (
    <Pressable style={styles.card} onPress={() => onPress(skill)}>
      <SubjectIcon name={skill.icon} size={48} />
      <View style={styles.info}>
        <ThemedText variant="cardTitle">{skill.name}</ThemedText>
        <ThemedText variant="caption">
          {status === "in-progress"
            ? `${percent}% · Sedang Dipelajari`
            : status === "completed"
              ? `${percent}% · Selesai`
              : skill.description}
        </ThemedText>
        <View style={styles.badge}>
          <ThemedText variant="levelBadge">{skill.level}</ThemedText>
        </View>
        {onAction ? (
          <Pressable
            onPress={() => onAction(skill)}
            hitSlop={6}
            style={({ pressed }) => [
              styles[action.style],
              pressed && styles.actionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${action.label} ${skill.name}`}
          >
            <ThemedText style={status === "completed" ? styles.doneButtonText : styles.actionButtonText}>
              {action.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      <ChevronRight size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.levelBadge,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actionButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.turquoise,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    color: colors.text,
  },
  doneButtonText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    color: colors.turquoise,
  },
});
