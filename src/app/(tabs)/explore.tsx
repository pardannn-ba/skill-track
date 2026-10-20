import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import type { Skill, SkillCategory } from "@/data/skills";
import { skillCategories, skillsData } from "@/data/skills";
import { getLearningPath, computeProgress } from "@/data/learning-path";
import {
  startSkill,
  type ProgressState,
} from "@/data/progress-store";
import { useProgressState } from "@/hooks/use-progress-state";
import SearchBar from "@/components/search-bar";
import CategoryFilter from "@/components/category-filter";
import SkillCard, { type SkillCardStatus } from "@/components/skill-card";
import ThemedText from "@/components/themed-text";

/**
 * Halaman Explore Skills: katalog seluruh skill dengan pencarian nama
 * (case-insensitive) + filter kategori. Setiap kartu menampilkan status
 * belajar dan tombol Mulai/Lanjutkan Belajar dari sumber data tunggal.
 */
export default function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | SkillCategory>("All");
  /** null = state belum dibaca dari storage. */
  const progress: ProgressState | null = useProgressState();

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return skillsData.filter((skill) => {
      const matchCategory =
        category === "All" || skill.category === category;
      const matchQuery =
        normalizedQuery.length === 0 ||
        skill.name.toLowerCase().includes(normalizedQuery);
      return matchCategory && matchQuery;
    });
  }, [query, category]);

  const statusOf = useCallback(
    (skill: Skill): { status: SkillCardStatus; percent: number } => {
      const path = getLearningPath(skill.id);
      const state = progress;
      if (!path || !state || !state.started.includes(skill.id)) {
        return { status: "not-started", percent: 0 };
      }
      const percent = computeProgress(path.materials, state.completed);
      return {
        status: percent >= 100 ? "completed" : "in-progress",
        percent,
      };
    },
    [progress],
  );

  /** Kartu ditekan: buka Learning Path skill (tanpa otomatis memulai). */
  const openSkill = useCallback(
    (skill: Skill) => {
      router.push({
        pathname: "/learning-path",
        params: { skillId: skill.id, from: "explore" },
      });
    },
    [router],
  );

  /**
   * Tombol Mulai Belajar: tambahkan skill ke daftar aktif (idempotent,
   * tidak bisa duplikat) lalu buka Learning Path-nya. Tombol Lanjutkan
   * pada skill aktif hanya membuka Learning Path (progres dipertahankan).
   */
  const handleAction = useCallback(
    async (skill: Skill) => {
      const { status } = statusOf(skill);
      if (status === "not-started") {
        await startSkill(skill.id);
      }
      openSkill(skill);
    },
    [statusOf, openSkill],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <FlatList
        data={filteredSkills}
        extraData={progress}
        keyExtractor={(skill) => skill.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <ThemedText variant="title">Jelajahi Skill</ThemedText>
              <ThemedText variant="subtitle">
                Pilih skill yang ingin kamu pelajari
              </ThemedText>
            </View>
            <SearchBar value={query} onChangeText={setQuery} />
            <View style={styles.filterWrap}>
              <CategoryFilter
                categories={skillCategories}
                active={category}
                onSelect={setCategory}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const { status, percent } = statusOf(item);
          return (
            <SkillCard
              skill={item}
              status={status}
              percent={percent}
              onPress={openSkill}
              onAction={(selected) => {
                void handleAction(selected);
              }}
            />
          );
        }}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ThemedText variant="cardTitle">Skill tidak ditemukan</ThemedText>
            <ThemedText variant="caption" style={styles.emptyCaption}>
              Coba kata kunci atau kategori lain.
            </ThemedText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 20,
    gap: 6,
  },
  filterWrap: {
    marginTop: 14,
    marginBottom: 20,
  },
  separator: {
    height: 14,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyCaption: {
    color: colors.textSecondary,
  },
});
