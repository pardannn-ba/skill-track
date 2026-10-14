import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { skillsData } from "@/data/skills";
import SubjectIcon from "@/components/subject-icon";
import ProgressBar from "@/components/progress-bar";
import ThemedText from "@/components/themed-text";

/**
 * Halaman detail skill, dibuka saat kartu di halaman Explore ditekan.
 * Mengikuti tema visual yang sama dengan dashboard & Explore.
 */
export default function SkillDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const skill = skillsData.find((item) => item.id === id);

  if (!skill) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFoundWrap}>
          <ThemedText variant="cardTitle">Skill tidak ditemukan</ThemedText>
          <Pressable onPress={() => router.back()}>
            <ThemedText style={styles.backLink}>Kembali</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "top"]}>
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <SubjectIcon name={skill.icon} size={56} />
          <ThemedText variant="title" style={styles.skillName}>
            {skill.name}
          </ThemedText>
          <ThemedText variant="subtitle">{skill.description}</ThemedText>
          <View style={styles.metaRow}>
            <ThemedText variant="caption">Kategori: {skill.category}</ThemedText>
            <ThemedText variant="caption">Level: {skill.level}</ThemedText>
          </View>
        </View>
        <View style={styles.progressCard}>
          <ThemedText variant="cardTitle">Progres Belajar</ThemedText>
          <ThemedText variant="caption">0 dari {skill.totalMaterials} materi selesai</ThemedText>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <ProgressBar value={0} height={8} />
            </View>
            <ThemedText variant="caption">0%</ThemedText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "flex-start",
    gap: 10,
  },
  skillName: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 6,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
  },
  notFoundWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  backLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
