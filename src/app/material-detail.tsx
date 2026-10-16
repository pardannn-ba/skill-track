import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors, learningColors } from "@/constants/theme";
import { htmlLearningPath } from "@/data/learning-path";
import ThemedText from "@/components/themed-text";

/**
 * Halaman detail materi Learning Path.
 * Dibuka dari baris materi aktif/selesai; materi terkunci tidak bisa dibuka.
 */
export default function MaterialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { materials } = htmlLearningPath;
  const index = materials.findIndex((material) => material.id === id);
  const material = index >= 0 ? materials[index] : undefined;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/learning-path");
    }
  };

  if (!material) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.notFoundWrap}>
          <ThemedText variant="cardTitle">Materi tidak ditemukan</ThemedText>
          <Pressable onPress={handleBack} hitSlop={8}>
            <ThemedText style={styles.backLink}>Kembali</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          hitSlop={10}
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Detail Materi</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText variant="caption">
          Materi {index + 1} dari {materials.length} · {htmlLearningPath.skillName}
        </ThemedText>
        <ThemedText style={styles.title}>{material.title}</ThemedText>
        <ThemedText variant="subtitle">{material.description}</ThemedText>

        <View style={styles.pointsCard}>
          <ThemedText variant="cardTitle">Yang akan dipelajari</ThemedText>
          {material.points.map((point, pointIndex) => (
            <View key={point} style={styles.pointRow}>
              <View style={styles.pointBadge}>
                <ThemedText style={styles.pointNumber}>
                  {pointIndex + 1}
                </ThemedText>
              </View>
              <ThemedText variant="body" style={styles.pointText}>
                {point}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 6,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  pointsCard: {
    marginTop: 18,
    gap: 14,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pointBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: learningColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pointNumber: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: learningColors.text,
  },
  pointText: {
    flex: 1,
    color: colors.text,
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
