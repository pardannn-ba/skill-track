import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors } from "@/constants/theme";
import type { SkillCategory } from "@/data/skills";

export type CategoryFilterProps = {
  categories: ("All" | SkillCategory)[];
  /** Kategori yang sedang aktif. */
  active: "All" | SkillCategory;
  onSelect: (category: "All" | SkillCategory) => void;
};

/**
 * Filter kategori horizontal yang dapat di-scroll ke samping.
 * Tombol aktif biru, tidak aktif navy dengan border tipis.
 */
export default function CategoryFilter({
  categories,
  active,
  onSelect,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((category) => {
        const isActive = category === active;
        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={[
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
            ]}
          >
            <Text style={isActive ? styles.chipTextActive : styles.chipTextInactive}>
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 2,
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.filterActive,
  },
  chipInactive: {
    backgroundColor: colors.filterInactive,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipTextActive: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  chipTextInactive: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
  },
});
