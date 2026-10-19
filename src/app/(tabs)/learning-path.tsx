import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, ChevronRight, Lock } from "lucide-react-native";
import { colors, learningColors } from "@/constants/theme";
import {
  getLearningPath,
  getActiveMaterialIndex,
  getMaterialStatus,
  countCompleted,
  computeProgress,
  sanitizeCompleted,
  type LearningMaterial,
  type LearningMaterialStatus,
} from "@/data/learning-path";
import {
  completeMaterial,
  loadProgress,
  startSkill,
  subscribeProgress,
} from "@/data/progress-store";
import { recordActivity } from "@/data/profile";
import ProgressBar from "@/components/progress-bar";
import SubjectIcon from "@/components/subject-icon";
import ThemedText from "@/components/themed-text";

/** Warna lingkaran/garis timeline berdasarkan status materi. */
function statusColor(status: LearningMaterialStatus): string {
  if (status === "completed") {
    return learningColors.success;
  }
  return status === "active"
    ? learningColors.primary
    : learningColors.lockedLine;
}

/**
 * Halaman Learning Path (Detail Skill) — dibuka dari kartu skill di
 * Explore/Profil/Progress dengan param `skillId`. Skill belum dimulai:
 * seluruh materi terkunci dan tombol "Mulai Belajar" tersedia.
 * Progress dihitung dari jumlah materi selesai (0%, 20%, 40%, ... 100%)
 * dan disimpan di AsyncStorage supaya tidak kembali ke 0% saat app dibuka lagi.
 */
export default function LearningPathScreen() {
  const router = useRouter();
  const { skillId, from } = useLocalSearchParams<{
    skillId?: string;
    from?: string;
  }>();

  const path = getLearningPath(skillId ?? "html");
  const { materials, skillName, subtitle, level, icon } = path ?? {
    materials: [],
    skillName: "Skill",
    subtitle: "",
    level: "",
    icon: "html" as const,
  };

  /** null = state belum dibaca dari penyimpanan. */
  const [completedIds, setCompletedIds] = useState<string[] | null>(null);
  const [started, setStarted] = useState<boolean | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeProgress((state) => {
      if (!isMounted || !path) {
        return;
      }
      setStarted(state.started.includes(path.skillId));
      setCompletedIds(sanitizeCompleted(materials, state.completed));
    });
    void loadProgress().then((state) => {
      if (!isMounted || !path) {
        return;
      }
      setStarted(state.started.includes(path.skillId));
      setCompletedIds(sanitizeCompleted(materials, state.completed));
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [path, materials]);

  const completed = completedIds ?? [];
  const completedCount = countCompleted(materials, completed);
  const progress = computeProgress(materials, completed);
  const activeIndex = getActiveMaterialIndex(materials, completed);
  const activeMaterial: LearningMaterial | null =
    activeIndex >= 0 ? materials[activeIndex] : null;
  const isStarted = started === true;
  const isFinished = started !== null && isStarted && activeMaterial === null;

  const handleBack = () => {
    // Halaman ini dibuka dari tab Explore/Progress/Home/Profil;
    // push ke route tab berperilaku seperti NAVIGATE (tanpa riwayat pop),
    // jadi back yang deterministik: kembali ke tab asal.
    router.replace(from === "progress" || from === "home" ? "/progress" : "/explore");
  };

  const handleStart = async () => {
    if (!path || isStarted || starting) {
      return;
    }
    setStarting(true);
    try {
      await startSkill(path.skillId);
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async () => {
    if (!started || activeMaterial === null) {
      return;
    }
    await completeMaterial(activeMaterial.id);
    await recordActivity(activeMaterial.id);
  };

  const openMaterial = useCallback(
    (material: LearningMaterial, status: LearningMaterialStatus) => {
      // Materi terkunci menampilkan pesan yang jelas (tidak dibuka).
      if (status === "locked") {
        const index = materials.findIndex((item) => item.id === material.id);
        const previous = index > 0 ? materials[index - 1] : null;
        Alert.alert(
          "Materi terkunci",
          previous
            ? `Selesaikan "${previous.title}" terlebih dahulu untuk membuka materi ini.`
            : "Selesaikan materi sebelumnya terlebih dahulu.",
        );
        return;
      }
      router.push({
        pathname: "/material-detail",
        params: { id: material.id },
      });
    },
    [materials, router],
  );

  if (!path) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.notFoundWrap}>
          <ThemedText variant="cardTitle">Skill tidak ditemukan</ThemedText>
          <Pressable onPress={handleBack} hitSlop={8}>
            <ThemedText style={styles.backLink}>Kembali</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          hitSlop={10}
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={24} color={learningColors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Learning Path</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Informasi skill */}
        <View style={styles.skillSection}>
          <SubjectIcon name={icon} size={64} />
          <View style={styles.skillInfo}>
            <ThemedText style={styles.skillTitle}>{skillName}</ThemedText>
            <ThemedText variant="subtitle">{subtitle}</ThemedText>
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{level}</ThemedText>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressLabel}>Progress</ThemedText>
            <ThemedText style={styles.progressPercent}>{progress}%</ThemedText>
          </View>
          <ProgressBar
            value={progress}
            height={8}
            fillColor={learningColors.success}
          />
          <ThemedText
            variant="caption"
            color={learningColors.textSecondary}
            style={styles.progressCaption}
          >
            {completedCount} dari {materials.length} materi selesai
          </ThemedText>
        </View>

        {/* Daftar materi + timeline */}
        <View style={styles.timelineCard}>
          {materials.map((material, index) => {
            const status = getMaterialStatus(materials, index, completed);
            const nextStatus =
              index < materials.length - 1
                ? getMaterialStatus(materials, index + 1, completed)
                : null;

            return (
              <Pressable
                key={material.id}
                onPress={() => openMaterial(material, status)}
                style={({ pressed }) => [
                  styles.row,
                  status === "active" && styles.rowActive,
                  pressed && status !== "locked" && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Materi ${index + 1}: ${material.title}`}
                accessibilityState={{ disabled: status === "locked" }}
              >
                {/* Garis timeline: bagian atas = warna status baris ini,
                    bagian bawah = warna status baris berikutnya. */}
                {index > 0 ? (
                  <View
                    style={[styles.lineTop, { backgroundColor: statusColor(status) }]}
                  />
                ) : null}
                {nextStatus ? (
                  <View
                    style={[
                      styles.lineBottom,
                      { backgroundColor: statusColor(nextStatus) },
                    ]}
                  />
                ) : null}

                <View
                  style={[
                    styles.circle,
                    status === "completed" && styles.circleCompleted,
                    status === "active" && styles.circleActive,
                    status === "locked" && styles.circleLocked,
                  ]}
                >
                  {status === "completed" ? (
                    <Check
                      size={18}
                      color={learningColors.text}
                      strokeWidth={3}
                    />
                  ) : (
                    <ThemedText
                      style={[
                        styles.circleNumber,
                        status === "locked" && styles.circleNumberLocked,
                      ]}
                    >
                      {index + 1}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.rowInfo}>
                  <ThemedText variant="cardTitle" style={styles.rowTitle}>
                    {material.title}
                  </ThemedText>
                  <ThemedText
                    variant="caption"
                    color={learningColors.textSecondary}
                  >
                    {material.description}
                  </ThemedText>
                </View>

                {status === "locked" ? (
                  <Lock size={18} color={learningColors.lockedText} />
                ) : (
                  <ChevronRight size={20} color={learningColors.textSecondary} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Status setelah seluruh materi selesai */}
        {isFinished ? (
          <View style={styles.finishedBanner}>
            <Check size={16} color={learningColors.success} strokeWidth={3} />
            <ThemedText
              variant="caption"
              color={learningColors.success}
              style={styles.finishedText}
            >
              Learning Path telah selesai! Semua materi sudah kamu pelajari.
            </ThemedText>
          </View>
        ) : null}

        {/* Tombol utama: Mulai Belajar (sebelum mulai) / Tandai Selesai */}
        {!isStarted ? (
          <Pressable
            onPress={() => {
              void handleStart();
            }}
            disabled={starting}
            style={({ pressed }) => [
              styles.completeButton,
              starting && styles.completeButtonDisabled,
              pressed && styles.completeButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Mulai belajar ${skillName}`}
          >
            <ThemedText style={styles.completeButtonText}>
              {starting ? "Memulai..." : "Mulai Belajar"}
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              void handleComplete();
            }}
            disabled={activeMaterial === null}
            style={({ pressed }) => [
              styles.completeButton,
              activeMaterial === null && styles.completeButtonDisabled,
              pressed && styles.completeButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tandai materi aktif selesai"
          >
            <ThemedText style={styles.completeButtonText}>
              {isFinished ? "Semua Materi Selesai" : "Tandai Selesai"}
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CIRCLE_SIZE = 36;
const ROW_PADDING_X = 12;

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
    color: learningColors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  skillSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
    marginBottom: 26,
  },
  skillInfo: {
    flex: 1,
    gap: 4,
  },
  skillTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: learningColors.text,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: learningColors.badgeBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: learningColors.badgeText,
  },
  progressSection: {
    marginBottom: 22,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: learningColors.text,
  },
  progressPercent: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: learningColors.text,
  },
  progressCaption: {
    marginTop: 10,
  },
  timelineCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: ROW_PADDING_X,
    paddingVertical: 13,
    borderRadius: 12,
    position: "relative",
  },
  rowActive: {
    backgroundColor: learningColors.cardActive,
  },
  rowPressed: {
    opacity: 0.8,
  },
  lineTop: {
    position: "absolute",
    left: ROW_PADDING_X + CIRCLE_SIZE / 2 - 1,
    top: 0,
    width: 2,
    height: "50%",
  },
  lineBottom: {
    position: "absolute",
    left: ROW_PADDING_X + CIRCLE_SIZE / 2 - 1,
    bottom: 0,
    width: 2,
    height: "50%",
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circleCompleted: {
    backgroundColor: learningColors.success,
  },
  circleActive: {
    backgroundColor: learningColors.primary,
  },
  circleLocked: {
    backgroundColor: learningColors.lockedCircle,
  },
  circleNumber: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: learningColors.text,
  },
  circleNumberLocked: {
    color: learningColors.lockedText,
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: learningColors.text,
  },
  finishedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(53, 217, 173, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(53, 217, 173, 0.45)",
  },
  finishedText: {
    flex: 1,
    color: learningColors.success,
  },
  completeButton: {
    marginTop: 22,
    height: 54,
    borderRadius: 14,
    backgroundColor: learningColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonDisabled: {
    opacity: 0.45,
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
