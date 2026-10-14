import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { Skill } from "@/data/skills";
import SubjectIcon from "@/components/subject-icon";
import ThemedText from "@/components/themed-text";

export type SkillCardProps = {
  skill: Skill;
  onPress: (skill: Skill) => void;
};

/**
 * Kartu skill pada halaman Explore: kotak ikon kiri, nama,
 * deskripsi, badge level kapsul hijau turquoise, dan chevron kanan.
 */
export default function SkillCard({ skill, onPress }: SkillCardProps) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(skill)}>
      <SubjectIcon name={skill.icon} size={48} />
      <View style={styles.info}>
        <ThemedText variant="cardTitle">{skill.name}</ThemedText>
        <ThemedText variant="caption">{skill.description}</ThemedText>
        <View style={styles.badge}>
          <ThemedText variant="levelBadge">{skill.level}</ThemedText>
        </View>
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
});
