import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { colors, learningColors } from "@/constants/theme";
import { findMaterialById } from "@/data/learning-path";
import {
  completeMaterial,
  loadProgress,
  subscribeProgress,
} from "@/data/progress-store";
import { recordActivity } from "@/data/profile";
import ThemedText from "@/components/ui/themed-text";

/**
 * Halaman detail materi Learning Path.
 * Dibuka dari baris materi aktif/selesai di Learning Path skill mana pun;
 * materi terkunci tidak pernah bisa dibuka dari halaman Learning Path.
 */
export default function MaterialDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const resolved = id ? findMaterialById(id) : null;
  const material = resolved?.material ?? null;
  const path = resolved?.path ?? null;
  const index = resolved?.index ?? -1;

  /** null = state belum dibaca; dipakai untuk status tombol selesai. */
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const refresh = (completed: string[]) => {
      if (isMounted && material) {
        setIsCompleted(completed.includes(material.id));
      }
    };
    const unsubscribe = subscribeProgress((state) => refresh(state.completed));
    void loadProgress().then((state) => refresh(state.completed));
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [material]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/learning-path");
    }
  };

  const handleComplete = async () => {
    if (!material || isCompleted) {
      return;
    }
    await completeMaterial(material.id);
    await recordActivity(material.id);
  };

  if (!material || !path) {
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
          Materi {index + 1} dari {path.materials.length} · {path.skillName}
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

        {/* Tombol tandai selesai — menyimpan status materi ke store tunggal */}
        <Pressable
          onPress={() => {
            void handleComplete();
          }}
          disabled={isCompleted !== true ? false : true}
          style={({ pressed }) => [
            styles.completeButton,
            isCompleted === true && styles.completeButtonDone,
            pressed && isCompleted !== true && styles.completeButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isCompleted === true
              ? "Materi sudah selesai"
              : "Tandai materi selesai"
          }
        >
          {isCompleted === true ? (
            <View style={styles.doneRow}>
              <Check size={18} color={learningColors.success} strokeWidth={3} />
              <ThemedText style={styles.completeButtonTextDone}>
                Materi Selesai
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.completeButtonText}>
              Tandai Selesai
            </ThemedText>
          )}
        </Pressable>
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
  completeButton: {
    marginTop: 22,
    height: 54,
    borderRadius: 14,
    backgroundColor: learningColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonDone: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: learningColors.success,
  },
  completeButtonPressed: {
    opacity: 0.85,
  },
  completeButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: learningColors.text,
  },
  completeButtonTextDone: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: learningColors.success,
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
