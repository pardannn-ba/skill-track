import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";
import ProgressBar from "@/components/ui/progress-bar";
import SubjectIcon from "@/components/ui/subject-icon";
import ThemedText from "@/components/ui/themed-text";
import {
  BellIcon,
  BookIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";
import NotificationPopup from "@/components/notifications/notification-popup";
import { useNotificationsState } from "@/hooks/use-notifications-state";
import { computeSummary, nextOpenMaterial, startedPaths, type ProgressState } from "@/data/progress-store";
import { useProgressState } from "@/hooks/use-progress-state";
import { useAuthState } from "@/hooks/use-auth-state";
import { profileSubtitle } from "@/data/profile";
import { computeProgress } from "@/data/learning-path";
import ProfileHeader from "@/components/profile/profile-header";

const bottomEdges: Edge[] = ["left", "right", "bottom"];

/**
 * Dashboard Home — menampilkan data aktual dari sumber data tunggal:
 * statistik keseluruhan, daftar skill aktif, dan materi terakhir yang
 * belum selesai. Skill yang belum dimulai tidak ditampilkan.
 */
export default function Dashboard() {
  const router = useRouter();
  const progress: ProgressState | null = useProgressState();
  // Profil diambil dari akun yang sedang login (bukan data demo hardcoded).
  const { session } = useAuthState();
  // Notifikasi lokal (data simulasi) — popup tanpa berpindah halaman.
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeAll,
  } = useNotificationsState();
  const [notificationOpen, setNotificationOpen] = useState(false);

  const summary = computeSummary(progress ?? { started: [], completed: [] });
  const paths = progress ? startedPaths(progress) : [];

  /** Kartu skill aktif: HTML & CSS berdampingan, sisanya full-width. */
  const activeSkillCards = paths.slice(0, 2).map((path) => {
    const percent = computeProgress(path.materials, progress?.completed ?? []);
    const next = nextOpenMaterial(path, progress ?? { started: [], completed: [] });
    return {
      id: path.skillId,
      icon: path.icon,
      title: path.skillName,
      subtitle:
        percent >= 100
          ? "Selesai"
          : next
            ? `${countDone(progress, path.skillId)} dari ${path.materials.length} materi`
            : `${path.materials.length} materi`,
      percent,
    };
  });
  const extraSkillCards = paths.slice(2).map((path) => {
    const percent = computeProgress(path.materials, progress?.completed ?? []);
    return {
      id: path.skillId,
      icon: path.icon,
      title: path.skillName,
      subtitle:
        percent >= 100
          ? "Selesai"
          : `${countDone(progress, path.skillId)} dari ${path.materials.length} materi`,
      percent,
    };
  });

  /** Kartu Lanjutkan Belajar: materi terakhir yang belum selesai. */
  const continueTarget = (() => {
    if (!progress) {
      return null;
    }
    for (const path of paths) {
      const next = nextOpenMaterial(path, progress);
      if (next) {
        const doneCount = countDone(progress, path.skillId);
        return {
          skillId: path.skillId,
          icon: path.icon,
          title: `${path.skillName} - ${next.title}`,
          subtitle: `Materi ke-${doneCount + 1} dari ${path.materials.length}`,
        };
      }
    }
    return null;
  })();

  const openContinue = () => {
    if (!continueTarget) {
      router.push("/(tabs)/explore");
      return;
    }
    router.push({
      pathname: "/learning-path",
      params: { skillId: continueTarget.skillId, from: "home" },
    });
  };

  return (
    <SafeAreaView edges={bottomEdges} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeHeader}>
          {/* Profil akun yang sedang login: inisial, nama, username/email */}
          <ProfileHeader
            fullName={session?.fullName ?? ""}
            subtitle={profileSubtitle({
              username: session?.username ?? "",
              email: session?.email ?? "",
            })}
            onSettingsPress={() => router.push("/settings")}
            style={styles.homeProfileHeader}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText variant="title">Selamat pagi! ☀️</ThemedText>
              <ThemedText variant="subtitle">Lanjutkan progresmu</ThemedText>
            </View>
            {/* Tombol lonceng: membuka pop-up notifikasi (bukan dekorasi). */}
            <Pressable
              onPress={() => setNotificationOpen(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.bellButton,
                pressed && styles.bellButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                unreadCount > 0
                  ? `Notifikasi, ${unreadCount} belum dibaca`
                  : "Notifikasi"
              }
            >
              <BellIcon size={22} color={colors.textSecondary} />
              {unreadCount > 0 ? (
                <View style={styles.bellBadge}>
                  <ThemedText style={styles.bellBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </ThemedText>
                </View>
              ) : null}
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Kartu Web Development — ringkas progres keseluruhan */}
        <Pressable
          onPress={() => router.push("/(tabs)/progress")}
          accessibilityRole="button"
          accessibilityLabel="Buka halaman Progress"
        >
          <View style={styles.mainCard}>
            <View style={styles.mainCardRow}>
              <View style={styles.mainIconBox}>
                <BookIcon size={26} color={colors.text} />
              </View>
              <View style={styles.mainCardInfo}>
                <ThemedText variant="cardTitle">Belajar Kamu</ThemedText>
                <ThemedText variant="caption">
                  {summary.activeSkills > 0
                    ? `${summary.completedMaterials} dari ${summary.totalMaterials} materi selesai`
                    : "Belum ada skill yang dimulai"}
                </ThemedText>
              </View>
              <ChevronRightIcon size={22} color={colors.text} />
            </View>
            <View style={styles.mainCardProgress}>
              <View style={styles.progressRow}>
                <View style={styles.progressTrackWrap}>
                  <ProgressBar value={summary.overallPercent} />
                </View>
                <ThemedText variant="stat">
                  {summary.overallPercent}%
                </ThemedText>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Skill Kamu */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="cardTitle">Skill Kamu</ThemedText>
          <Pressable
            hitSlop={6}
            onPress={() => router.push("/(tabs)/explore")}
            accessibilityRole="button"
            accessibilityLabel="Lihat semua skill"
          >
            <ThemedText variant="caption" style={styles.linkText}>
              Jelajahi Skill
            </ThemedText>
          </Pressable>
        </View>
        {paths.length === 0 ? (
          /* Belum ada skill dimulai: ajakan menjelajah, layout tetap sama */
          <View style={styles.skillCard}>
            <ThemedText variant="cardTitle">Belum ada skill</ThemedText>
            <ThemedText variant="caption">
              Mulai belajar dengan menjelajahi skill di halaman Explore.
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Dua skill aktif pertama berdampingan */}
            <View style={styles.skillGrid}>
              {activeSkillCards.map((skill) => (
                <Pressable
                  key={skill.id}
                  style={styles.skillCard}
                  onPress={() =>
                    router.push({
                      pathname: "/learning-path",
                      params: { skillId: skill.id, from: "home" },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Buka ${skill.title}`}
                >
                  <SubjectIcon name={skill.icon} />
                  <ThemedText variant="cardTitle" style={styles.skillTitle}>
                    {skill.title}
                  </ThemedText>
                  <ThemedText variant="caption">{skill.subtitle}</ThemedText>
                  <View style={styles.skillProgressRow}>
                    <View style={styles.skillProgressTrack}>
                      <ProgressBar value={skill.percent} height={6} />
                    </View>
                    <ThemedText variant="caption">{skill.percent}%</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Skill aktif lainnya: kartu full-width */}
            {extraSkillCards.map((skill) => (
              <Pressable
                key={skill.id}
                style={[styles.skillCard, styles.uiuxCard]}
                onPress={() =>
                  router.push({
                    pathname: "/learning-path",
                    params: { skillId: skill.id, from: "home" },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Buka ${skill.title}`}
              >
                <View style={styles.uiuxRow}>
                  <SubjectIcon name={skill.icon} />
                  <View style={styles.uiuxInfo}>
                    <ThemedText variant="cardTitle">{skill.title}</ThemedText>
                    <ThemedText variant="caption">{skill.subtitle}</ThemedText>
                  </View>
                </View>
                <View style={styles.skillProgressRow}>
                  <View style={styles.skillProgressTrack}>
                    <ProgressBar value={skill.percent} height={6} />
                  </View>
                  <ThemedText variant="caption">{skill.percent}%</ThemedText>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {/* Lanjutkan Belajar */}
        <View style={[styles.sectionHeader, styles.continueHeader]}>
          <ThemedText variant="cardTitle">Lanjutkan Belajar</ThemedText>
        </View>
        <Pressable
          onPress={openContinue}
          accessibilityRole="button"
          accessibilityLabel="Lanjutkan belajar materi terakhir"
        >
          <View style={styles.continueCard}>
            <View style={styles.mainIconBox}>
              <BookIcon size={26} color={colors.text} />
            </View>
            <View style={styles.continueInfo}>
              <ThemedText variant="cardTitle" numberOfLines={1}>
                {continueTarget
                  ? continueTarget.title
                  : "Belum ada materi berjalan"}
              </ThemedText>
              <ThemedText variant="caption" numberOfLines={1}>
                {continueTarget
                  ? continueTarget.subtitle
                  : "Jelajahi skill untuk mulai belajar"}
              </ThemedText>
            </View>
            <ChevronRightIcon size={22} color={colors.textSecondary} />
          </View>
        </Pressable>
      </ScrollView>

      {/* Pop-up notifikasi (overlay) — pengguna tetap di Dashboard. */}
      <NotificationPopup
        visible={notificationOpen}
        notifications={notifications}
        onClose={() => setNotificationOpen(false)}
        onRead={markAsRead}
        onMarkAllRead={markAllAsRead}
        onDeleteAll={removeAll}
      />
    </SafeAreaView>
  );
}

/** Jumlah materi selesai untuk satu skill aktif (dari store, tanpa duplikat). */
function countDone(progress: ProgressState | null, skillId: string): number {
  const completed = progress?.completed ?? [];
  const seen = new Set<string>();
  for (const id of completed) {
    if (id.startsWith(`${skillId}-`)) {
      seen.add(id);
    }
  }
  return seen.size;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeHeader: {
    backgroundColor: colors.background,
  },
  homeProfileHeader: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: {
    gap: 4,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginTop: -2,
  },
  bellButtonPressed: {
    opacity: 0.75,
  },
  bellBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.background,
  },
  bellBadgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mainCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
  },
  mainCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  mainIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.blueLayer,
    alignItems: "center",
    justifyContent: "center",
  },
  mainCardInfo: {
    flex: 1,
    gap: 3,
  },
  mainCardProgress: {
    marginTop: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrackWrap: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
  },
  skillGrid: {
    flexDirection: "row",
    gap: 12,
  },
  skillCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  skillTitle: {
    marginTop: 10,
  },
  skillProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  skillProgressTrack: {
    flex: 1,
  },
  uiuxCard: {
    flex: undefined,
    marginTop: 12,
    gap: 10,
  },
  uiuxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  uiuxInfo: {
    flex: 1,
    gap: 3,
  },
  continueHeader: {
    marginTop: 24,
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  continueInfo: {
    flex: 1,
    gap: 3,
  },
});
