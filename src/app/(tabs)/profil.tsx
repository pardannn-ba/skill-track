import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Svg, { Circle, type CircleProps } from "react-native-svg";
import { colors } from "@/constants/theme";
import ProfileHeader from "@/components/profile/profile-header";
import { useAuthState } from "@/hooks/use-auth-state";
import {
  buildWeeklyActivity,
  computeProfileStats,
  profileSubtitle,
  readActivityTimestamps,
  type ProfileStats,
} from "@/data/profile";
import {
  BookCheckIcon,
  LogOutIcon,
  StarIcon,
} from "@/components/ui/icons";
import { logout } from "@/data/auth";
import ProgressBar from "@/components/ui/progress-bar";
import SubjectIcon from "@/components/ui/subject-icon";
import ThemedText from "@/components/ui/themed-text";

const bottomEdges: Edge[] = ["left", "right", "bottom"];
const topEdges: Edge[] = ["top", "left", "right"];

/** Dimensi & geometri progress ring SVG (sesuai proporsi screenshot). */
const RING_SIZE = 86;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Tinggi maksimum batang grafik aktivitas. */
const BAR_MAX_HEIGHT = 56;
/**
 * Jumlah aktivitas per hari yang dianggap "penuh" pada skala grafik.
 * Hari dengan lebih dari ini tetap digambar penuh (tidak meluap).
 */
const BAR_SCALE_MAX = 4;

/** Warna & ukuran kartu agar konsisten dengan screenshot referensi. */
const statIconBox = {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#203A5A",
  // Ikon dipusatkan di dalam lingkaran agar checklist & bintang rapi
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

/**
 * Ring progress SVG. Track biru keabu-abuan, fill turquoise mengikuti
 * persentase (mulai dari atas, searah jarum jam).
 */
function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const filledLength = (clamped / 100) * RING_CIRCUMFERENCE;
  const circleProps: CircleProps = {
    cx: RING_SIZE / 2,
    cy: RING_SIZE / 2,
    r: RING_RADIUS,
    strokeWidth: RING_STROKE,
    fill: "none",
    strokeLinecap: "round",
  };
  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* Track */}
        <Circle
          {...circleProps}
          stroke={colors.blueLayer}
        />
        {/* Progress fill; dimulai di atas lingkaran */}
        {clamped > 0 ? (
          <Circle
            {...circleProps}
            stroke={colors.turquoise}
            strokeDasharray={`${filledLength} ${RING_CIRCUMFERENCE - filledLength}`}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.ringCenter}>
        <ThemedText variant="stat" style={styles.ringPercent}>
          {clamped}%
        </ThemedText>
      </View>
    </View>
  );
}

/**
 * Satu batang grafik aktivitas mingguan. Tinggi proporsional terhadap
 * aktivitas terbanyak dalam minggu itu (skala dinamis), dengan minimum
 * agar hari tanpa aktivitas tetap menampilkan titik kecil yang rapi.
 */
function ActivityBar({ label, count, scaleMax }: { label: string; count: number; scaleMax: number }) {
  const scale = scaleMax > 0 ? scaleMax : BAR_SCALE_MAX;
  const height =
    count > 0
      ? Math.max(10, Math.round((Math.min(count, scale) / scale) * BAR_MAX_HEIGHT))
      : 6;
  return (
    <View style={styles.barColumn}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { height },
          ]}
        />
      </View>
      <ThemedText variant="caption" style={styles.barLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

/** Baris skill pada kartu "Skill Saya". */
function SkillRow({
  icon,
  name,
  percent,
  onPress,
}: {
  icon: "html" | "css" | "uiux" | "english";
  name: string;
  percent: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.skillRow, pressed && styles.skillRowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Buka learning path ${name}`}
    >
      <SubjectIcon name={icon} size={44} />
      <View style={styles.skillInfo}>
        <ThemedText variant="cardTitle">{name}</ThemedText>
        <View style={styles.skillProgressTrack}>
          <ProgressBar value={percent} height={7} />
        </View>
      </View>
      <ThemedText variant="caption" style={styles.skillPercent}>
        {percent}%
      </ThemedText>
    </Pressable>
  );
}

export default function Profil() {
  const router = useRouter();
  // Profil (nama/username/email) datang dari sesi login — sumber tunggal
  // di auth store — sehingga otomatis ikut berubah setelah Edit Profil/
  // Ganti Password dan selalu milik akun yang sedang login.
  const { session } = useAuthState();
  /** null = data progress sesi belum dibaca. */
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [weekly, setWeekly] = useState<{ label: string; count: number }[]>([]);

  const refresh = useCallback(async () => {
    // Stats & aktivitas berasal dari sesi memori — cepat, lokal.
    const [profileStats, activity] = await Promise.all([
      computeProfileStats(),
      readActivityTimestamps(),
    ]);
    setStats(profileStats);
    setWeekly(buildWeeklyActivity(activity));
  }, []);

  // Muat data saat tab dibuka, dan muat ulang setiap kali tab ini kembali
  // fokus (mis. dari Learning Path setelah menyelesaikan materi) supaya
  // statistik selalu sinkron.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const statsData: ProfileStats = useMemo(
    () => stats ?? { completedMaterials: 0, totalMaterials: 0, overallPercent: 0, skills: [], activeSkills: 0 },
    [stats],
  );

  /** Jumlah skill yang benar-benar sudah dimulai (dari store tunggal). */
  const activeSkillCount = statsData.activeSkills;

  const openSkill = (skillId: string) => {
    // Semua kartu skill di Profil membuka Learning Path skill-nya;
    // `from` dipakai Learning Path untuk kembali ke tab Profil.
    router.push({
      pathname: "/learning-path",
      params: { skillId, from: "profile" },
    });
  };

  /** Akhiri sesi login → guard di _layout mengalihkan ke halaman Login. */
  const handleLogout = async () => {
    await logout();
    // Tidak perlu navigasi manual: saat sesi berubah, guard Stack.Protected
    // otomatis membuang riwayat halaman utama dan mengalihkan ke Login,
    // sehingga tombol kembali tidak bisa melewati halaman login.
  };

  return (
    <SafeAreaView edges={bottomEdges} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={topEdges} style={styles.safeHeader}>
          {/* Header profil — inisial, nama, dan username/email dari
              akun yang sedang login; ikon roda gigi → halaman Pengaturan */}
          <ProfileHeader
            fullName={session?.fullName ?? ""}
            subtitle={profileSubtitle({
              username: session?.username ?? "",
              email: session?.email ?? "",
            })}
            onSettingsPress={() => router.push("/settings")}
          />
        </SafeAreaView>

        {/* Kartu Progress Keseluruhan */}
        <View style={styles.card}>
          <ThemedText variant="cardTitle">Progress Keseluruhan</ThemedText>
          <View style={styles.progressCardBody}>
            <ProgressRing percent={statsData.overallPercent} />
            <View style={styles.statList}>
              <View style={styles.statRow}>
                <View style={statIconBox}>
                  <BookCheckIcon size={20} color={colors.text} />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText variant="caption">Materi Selesai</ThemedText>
                  <ThemedText variant="cardTitle" style={styles.statValue}>
                    {statsData.completedMaterials}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={statIconBox}>
                  <StarIcon size={20} color={colors.star} />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText variant="caption">Skill Aktif</ThemedText>
                  <ThemedText variant="cardTitle" style={styles.statValue}>
                    {activeSkillCount}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Kartu Aktivitas Mingguan */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText variant="cardTitle">Aktivitas Mingguan</ThemedText>
            <Pressable
              hitSlop={6}
              onPress={() => router.push("/activity-history")}
              accessibilityRole="button"
              accessibilityLabel="Lihat semua aktivitas"
            >
              <ThemedText variant="caption" style={styles.linkText}>
                Lihat semua
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.chartRow}>
            {weekly.map((day, index) => (
              <ActivityBar
                key={`${day.label}-${index}`}
                label={day.label}
                count={day.count}
                scaleMax={Math.max(BAR_SCALE_MAX, ...weekly.map((d) => d.count))}
              />
            ))}
          </View>
        </View>

        {/* Kartu Skill Saya */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText variant="cardTitle">Skill Saya</ThemedText>
            <Pressable
              hitSlop={6}
              onPress={() => router.push("/(tabs)/explore")}
              accessibilityRole="button"
              accessibilityLabel="Lihat semua skill"
            >
              <ThemedText variant="caption" style={styles.linkText}>
                Lihat semua
              </ThemedText>
            </Pressable>
          </View>
          {statsData.skills.length === 0 ? (
            <ThemedText variant="caption">
              Belum ada skill yang dimulai. Mulai dari halaman Explore.
            </ThemedText>
          ) : (
            statsData.skills.map((skill) => (
              <SkillRow
                key={skill.id}
                icon={skill.icon}
                name={skill.name}
                percent={skill.percent}
                onPress={() => openSkill(skill.id)}
              />
            ))
          )}
        </View>

        {/* Logout — kembali ke halaman Login */}
        <Pressable
          onPress={() => {
            void handleLogout();
          }}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Keluar dari akun"
        >
          <LogOutIcon size={18} color={colors.authError} />
          <ThemedText style={styles.logoutText}>Keluar</ThemedText>
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
  safeHeader: {
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
  },
  progressCardBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 12,
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
  },
  ringPercent: {
    fontSize: 20,
    lineHeight: 26,
  },
  statList: {
    flex: 1,
    gap: 16,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statInfo: {
    flexShrink: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: 18,
    alignSelf: "center",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    height: BAR_MAX_HEIGHT,
  },
  barFill: {
    width: "100%",
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    overflow: "hidden",
  },
  barLabel: {
    fontSize: 12,
  },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  skillRowPressed: {
    opacity: 0.8,
  },
  skillInfo: {
    flex: 1,
    gap: 8,
  },
  skillProgressTrack: {
    width: "100%",
  },
  skillPercent: {
    color: colors.text,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.authInputBorder,
    backgroundColor: colors.card,
    marginTop: 4,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.authError,
  },
});
