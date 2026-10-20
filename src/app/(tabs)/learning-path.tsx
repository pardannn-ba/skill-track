import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Lock,
} from "lucide-react-native";
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
import EnglishMaterialDetail from "@/components/english-material-detail";

/** Warna lingkaran/garis timeline berdasarkan status materi. */
function statusColor(status: LearningMaterialStatus): string {
  if (status === "completed") {
    return learningColors.success;
  }
  return status === "active"
    ? learningColors.primary
    : learningColors.lockedLine;
}

/** Font monospace untuk blok contoh kode (per platform). */
const codeFontFamily = Platform.select({
  ios: "Menlo",
  default: "monospace",
}) as string;

/**
 * Halaman Learning Path (Detail Skill) — dibuka dari kartu skill di
 * Explore/Profil/Progress dengan param `skillId`.
 *
 * Sesuai screenshot referensi: menekan kartu materi membuka detail
 * INLINE di dalam kartu (penjelasan + contoh kode + link referensi +
 * tombol Tandai Selesai). Hanya satu detail yang terbuka pada satu waktu;
 * kecuali untuk skill English yang memakai detail bahasa khusus
 * (EnglishMaterialDetail) sesuai jenis kontennya.
 * menekan kartunya lagi menutup detail. Progress dihitung dari jumlah
 * materi selesai (0%, 20%, 40%, ... 100%) dan disimpan sementara di
 * memori sesi (hilang saat aplikasi di-reload).
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
  /** Id materi yang detailnya sedang terbuka (maks. satu). */
  const [openId, setOpenId] = useState<string | null>(null);
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
    // Halaman ini hidup di dalam (tabs), jadi back yang deterministik:
    // kembali ke tab asalnya. `from` dikirim oleh halaman asal
    // (progress/home/explore/profil), default explore.
    const target =
      from === "progress"
        ? "/(tabs)/progress"
        : from === "home"
          ? "/"
          : from === "profile"
            ? "/(tabs)/profil"
            : "/(tabs)/explore";
    router.replace(target);
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

  /** Tandai materi aktif selesai (tombol bawah) — tanpa duplikasi. */
  const handleComplete = async () => {
    if (!started || activeMaterial === null) {
      return;
    }
    await completeMaterial(activeMaterial.id);
    await recordActivity(activeMaterial.id);
  };

  /** Tandai materi yang detailnya terbuka sebagai selesai, lalu tutup detail. */
  const handleCompleteOpen = async (material: LearningMaterial) => {
    // Hanya materi aktif (pertama yang belum selesai) yang boleh ditandai;
    // mencegah lompatan prasyarat dan progres ganda.
    if (!activeMaterial || material.id !== activeMaterial.id) {
      return;
    }
    await completeMaterial(material.id);
    await recordActivity(material.id);
    setOpenId(null);
  };

  /** Buka/tutup detail materi; materi terkunci menampilkan pesan yang jelas. */
  const toggleMaterial = useCallback(
    (material: LearningMaterial, status: LearningMaterialStatus) => {
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
      setOpenId((prev) => (prev === material.id ? null : material.id));
    },
    [materials],
  );

  /** Buka URL referensi di browser (W3Schools / British Council); gagal ditangani rapi. */
  const openReference = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error("url not supported");
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Tautan gagal dibuka",
        `Periksa koneksi internet atau buka URL secara manual:\n${url}`,
      );
    }
  }, []);

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
            const isOpen = openId === material.id && status !== "locked";

            return (
              <View key={material.id} style={styles.materialWrap}>
                {/* Baris header materi: nomor/centang, judul, deskripsi, panah/gembok */}
                <Pressable
                  onPress={() => toggleMaterial(material, status)}
                  style={({ pressed }) => [
                    styles.row,
                    (status === "active" || isOpen) && styles.rowActive,
                    pressed && status !== "locked" && styles.rowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Materi ${index + 1}: ${material.title}`}
                  accessibilityState={{
                    disabled: status === "locked",
                    expanded: isOpen,
                  }}
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
                  ) : isOpen ? (
                    <ChevronUp size={20} color={learningColors.textSecondary} />
                  ) : (
                    <ChevronRight size={20} color={learningColors.textSecondary} />
                  )}
                </Pressable>

                {/* Detail materi terbuka: penjelasan + contoh kode + link + tombol.
                    Untuk skill English, detail memakai komponen bahasa khusus. */}
                {isOpen ? (
                  path.skillId === "english" && material.english ? (
                    <EnglishMaterialDetail
                      material={material}
                      isCompleted={status === "completed"}
                      onComplete={() => {
                        void handleCompleteOpen(material);
                      }}
                      onOpenReference={(url) => {
                        void openReference(url);
                      }}
                    />
                  ) : (
                  <View style={styles.detail}>
                    <ThemedText variant="body" style={styles.detailText}>
                      {material.explanation}
                    </ThemedText>

                    {material.codeExample ? (
                      <>
                        <ThemedText
                          variant="caption"
                          color={learningColors.textSecondary}
                          style={styles.codeLabel}
                        >
                          Contoh kode:
                        </ThemedText>
                        <View style={styles.codeBlock}>
                          {material.codeExample.split("\n").map((line, lineIndex) => (
                            <ThemedText key={lineIndex} style={styles.codeLine}>
                              {line.length > 0 ? line : " "}
                            </ThemedText>
                          ))}
                        </View>
                      </>
                    ) : null}

                    <Pressable
                      onPress={() => {
                        void openReference(material.referenceUrl);
                      }}
                      style={({ pressed }) => [
                        styles.linkRow,
                        pressed && styles.rowPressed,
                      ]}
                      accessibilityRole="link"
                      accessibilityLabel="Pelajari lebih lanjut di W3Schools"
                    >
                      <ExternalLink size={16} color={learningColors.primary} />
                      <ThemedText style={styles.linkText}>
                        Pelajari lebih lanjut di W3Schools
                      </ThemedText>
                      <ChevronRight size={18} color={learningColors.textSecondary} />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        void handleCompleteOpen(material);
                      }}
                      disabled={status === "completed"}
                      style={({ pressed }) => [
                        styles.completeButton,
                        status === "completed" && styles.completeButtonDone,
                        pressed && status !== "completed" && styles.rowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={
                        status === "completed"
                          ? "Materi sudah selesai"
                          : `Tandai ${material.title} selesai`
                      }
                    >
                      {status === "completed" ? (
                        <ThemedText style={styles.completeButtonText}>
                          Materi Selesai
                        </ThemedText>
                      ) : (
                        <View style={styles.doneRow}>
                          <Check size={18} color={learningColors.text} strokeWidth={3} />
                          <ThemedText style={styles.completeButtonText}>
                            Tandai Selesai
                          </ThemedText>
                        </View>
                      )}
                    </Pressable>
                  </View>
                  )
                ) : null}
              </View>
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

        {/* Tombol bawah: Mulai Belajar (sebelum mulai) / Tandai Selesai
            untuk materi aktif. Disembunyikan saat ada detail materi terbuka
            agar tombol tidak tampil ganda dan tidak menyelesaikan materi
            yang berbeda dari yang sedang dilihat pengguna. */}
        {!isStarted ? (
          <Pressable
            onPress={() => {
              void handleStart();
            }}
            disabled={starting}
            style={({ pressed }) => [
              styles.completeButton,
              styles.bottomButton,
              starting && styles.completeButtonDisabled,
              pressed && styles.rowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Mulai belajar ${skillName}`}
          >
            <ThemedText style={styles.completeButtonText}>
              {starting ? "Memulai..." : "Mulai Belajar"}
            </ThemedText>
          </Pressable>
        ) : openId === null ? (
          <Pressable
            onPress={() => {
              void handleComplete();
            }}
            disabled={activeMaterial === null}
            style={({ pressed }) => [
              styles.completeButton,
              styles.bottomButton,
              activeMaterial === null && styles.completeButtonDisabled,
              pressed && styles.rowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Tandai materi aktif selesai"
          >
            <ThemedText style={styles.completeButtonText}>
              {isFinished ? "Semua Materi Selesai" : "Tandai Selesai"}
            </ThemedText>
          </Pressable>
        ) : null}
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
  materialWrap: {
    position: "relative",
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
  detail: {
    paddingHorizontal: ROW_PADDING_X,
    paddingBottom: 14,
    gap: 10,
  },
  detailText: {
    color: learningColors.text,
    lineHeight: 22,
  },
  codeLabel: {
    marginTop: 2,
  },
  codeBlock: {
    backgroundColor: "#08131F",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  codeLine: {
    fontFamily: codeFontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: "#7BE3C8",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: learningColors.primary,
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
  bottomButton: {
    marginTop: 22,
  },
  completeButtonDisabled: {
    opacity: 0.45,
  },
  completeButtonDone: {
    opacity: 0.55,
  },
  completeButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: learningColors.text,
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
