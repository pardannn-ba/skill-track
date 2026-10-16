import { useMemo, useState } from "react";
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
import SearchBar from "@/components/search-bar";
import CategoryFilter from "@/components/category-filter";
import SkillCard from "@/components/skill-card";
import ThemedText from "@/components/themed-text";

/**
 * Halaman Explore Skills: pencarian berdasarkan nama skill
 * (case-insensitive) + filter kategori yang bekerja bersamaan.
 */
export default function ExploreScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | SkillCategory>("All");

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

  const openSkillDetail = (skill: Skill) => {
    // Kartu HTML di Explore membuka halaman Learning Path (Detail Skill).
    if (skill.id === "html") {
      router.push("/learning-path");
      return;
    }
    router.push({
      pathname: "/skill-detail",
      params: { id: skill.id },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <FlatList
        data={filteredSkills}
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
        renderItem={({ item }) => (
          <SkillCard skill={item} onPress={openSkillDetail} />
        )}
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
