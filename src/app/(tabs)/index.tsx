import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import ProgressBar from "@/components/progress-bar";
import SubjectIcon from "@/components/subject-icon";
import ThemedText from "@/components/themed-text";
import {
  BellIcon,
  BookIcon,
  ChevronRightIcon,
} from "@/components/icons";

/** Data dashboard — dipisah agar komponen tetap reusable. */
const dashboardData = {
  greeting: "Selamat pagi! ☀️",
  subtitle: "Lanjutkan progresmu",
  mainCourse: {
    title: "Web Development",
    subtitle: "3 dari 5 materi selesai",
    progressPercent: 60,
  },
  skills: [
    { icon: "html", title: "HTML", subtitle: "4 dari 5 materi", percent: 80 },
    { icon: "css", title: "CSS", subtitle: "1 dari 4 materi", percent: 25 },
    { icon: "uiux", title: "UI/UX Design", subtitle: "0 dari 6 materi", percent: 0 },
  ] as const,
  continueLearning: {
    icon: "html" as const,
    title: "HTML - Heading & Paragraf",
    subtitle: "Materi ke-2 dari 5",
  },
};

const bottomEdges: Edge[] = ["left", "right", "bottom"];
const topEdges: Edge[] = ["top", "left", "right"];

export default function Dashboard() {
  const { mainCourse, skills, continueLearning } = dashboardData;
  return (
    <SafeAreaView edges={bottomEdges} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={topEdges} style={styles.safeHeader}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText variant="title">Selamat pagi! ☀️</ThemedText>
              <ThemedText variant="subtitle">Lanjutkan progresmu</ThemedText>
            </View>
            <BellIcon size={26} color={colors.textSecondary} />
          </View>
        </SafeAreaView>

        {/* Kartu Web Development */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardRow}>
            <View style={styles.mainIconBox}>
              <BookIcon size={26} color={colors.text} />
            </View>
            <View style={styles.mainCardInfo}>
              <ThemedText variant="cardTitle">Web Development</ThemedText>
              <ThemedText variant="caption">
                {mainCourse.subtitle}
              </ThemedText>
            </View>
            <ChevronRightIcon size={22} color={colors.text} />
          </View>
          <View style={styles.mainCardProgress}>
            <View style={styles.progressRow}>
              <View style={styles.progressTrackWrap}>
                <ProgressBar value={mainCourse.progressPercent} />
              </View>
              <ThemedText variant="stat">
                {mainCourse.progressPercent}%
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Skill Kamu */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="cardTitle">Skill Kamu</ThemedText>
          <ThemedText variant="caption" style={styles.linkText}>
            Lihat semua
          </ThemedText>
        </View>
        {/* HTML & CSS berdampingan */}
        <View style={styles.skillGrid}>
          {skills.slice(0, 2).map((skill) => (
            <View key={skill.title} style={styles.skillCard}>
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
            </View>
          ))}
        </View>

        {/* Kartu UI/UX full-width */}
        <View style={[styles.skillCard, styles.uiuxCard]}>
          <View style={styles.uiuxRow}>
            <SubjectIcon name="uiux" />
            <View style={styles.uiuxInfo}>
              <ThemedText variant="cardTitle">UI/UX Design</ThemedText>
              <ThemedText variant="caption">0 dari 6 materi</ThemedText>
            </View>
          </View>
          <View style={styles.skillProgressRow}>
            <View style={styles.skillProgressTrack}>
              <ProgressBar value={0} height={6} />
            </View>
            <ThemedText variant="caption">0%</ThemedText>
          </View>
        </View>

        {/* Lanjutkan Belajar */}
        <View style={[styles.sectionHeader, styles.continueHeader]}>
          <ThemedText variant="cardTitle">Lanjutkan Belajar</ThemedText>
        </View>
        <View style={styles.continueCard}>
          <View style={styles.mainIconBox}>
            <BookIcon size={26} color={colors.text} />
          </View>
          <View style={styles.continueInfo}>
            <ThemedText variant="cardTitle">
              {continueLearning.title}
            </ThemedText>
            <ThemedText variant="caption">{continueLearning.subtitle}</ThemedText>
          </View>
          <ChevronRightIcon size={22} color={colors.textSecondary} />
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
  safeHeader: {
    backgroundColor: colors.background,
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
