import { StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Circle, type CircleProps } from "react-native-svg";
import { colors } from "@/constants/theme";
import { getLearningPath, computeProgress } from "@/data/learning-path";
import {
  nextOpenMaterial,
  type ProgressState,
} from "@/data/progress-store";
import { useProgressState } from "@/hooks/use-progress-state";
import ProgressBar from "@/components/progress-bar";
import SubjectIcon from "@/components/subject-icon";
import ThemedText from "@/components/themed-text";
import { ChevronRightIcon } from "@/components/icons";

const bottomEdges: Edge[] = ["left", "right", "bottom"];

/** Dimensi ring kecil di kartu skill (sesuai screenshot referensi). */
const RING_SIZE = 44;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Ring kecil menyerupai lingkaran progress pada screenshot Progress. */
function SmallRing({ percent }: { percent: number }) {
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
        <Circle {...circleProps} stroke={colors.blueLayer} />
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
        <ThemedText variant="caption" style={styles.ringPercent}>
          {clamped}%
        </ThemedText>
      </View>
    </View>
  );
}

/** Satu kartu skill yang sudah dimulai di halaman Progress. */
function SkillProgressCard({
  skillId,
  name,
  description,
  progress,
  nextTitle,
  onPress,
}: {
  skillId: string;
  name: string;
  description: string;
  progress: number;
  nextTitle: string | null;
  onPress: () => void;
}) {
  return (
    <View style={styles.skillCard}>
      <View style={styles.skillCardRow}>
        <SubjectIcon name={iconOf(skillId)} size={48} />
        <View style={styles.skillCardInfo}>
          <ThemedText variant="cardTitle">{name}</ThemedText>
          <ThemedText variant="caption">{description}</ThemedText>
        </View>
      </View>
      <View style={styles.skillCardFooter}>
        <SmallRing percent={progress} />
        <View style={styles.skillCardStatus}>
          <ThemedText variant="caption">
            {progress >= 100
              ? "Selesai"
              : nextTitle
                ? `Lanjut: ${nextTitle}`
                : "Materi belum tersedia"}
          </ThemedText>
          <ProgressBar value={progress} height={6} />
        </View>
        <ChevronRightIcon size={22} color={colors.textSecondary} />
      </View>
      {/* Seluruh kartu dapat ditekan = Lanjutkan Belajar materi terakhir */}
      {onPress ? (
        <ThemedText
          style={styles.continueHint}
          onPress={onPress}
          color={colors.primary}
        >
          Lanjutkan Belajar
        </ThemedText>
      ) : null}
    </View>
  );
}

function iconOf(skillId: string) {
  if (skillId === "html") return "html" as const;
  if (skillId === "css") return "css" as const;
  if (skillId === "uiux") return "uiux" as const;
  return "english" as const;
}

/**
 * Halaman Progress: hanya skill yang sudah dimulai (via tombol
 * Mulai Belajar di Explore). Persentase dihitung dari materi selesai,
 * bukan disimpan sebagai angka statis.
 */
export default function ProgressScreen() {
  const router = useRouter();
  const progress: ProgressState | null = useProgressState();
  const started = progress?.started ?? [];
  const hasStarted = started.length > 0;

  const openSkill = (skillId: string) => {
    router.push({
      pathname: "/learning-path",
      params: { skillId, from: "progress" },
    });
  };

  return (
    <SafeAreaView edges={bottomEdges} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="title">Progress</ThemedText>
        <ThemedText variant="subtitle">Lanjutkan progresmu</ThemedText>
      </View>

      {!hasStarted ? (
        <View style={styles.emptyWrap}>
          <ThemedText variant="cardTitle">Belum ada skill dimulai</ThemedText>
          <ThemedText variant="caption" style={styles.emptyCaption}>
            Mulai belajar skill pertamamu dari halaman Explore.
          </ThemedText>
          <SearchReset onGoToExplore={() => router.push("/(tabs)/explore")} />
        </View>
      ) : (
        <View style={styles.skillList}>
          {started.map((skillId) => {
            const path = getLearningPath(skillId);
            if (!path) {
              return null;
            }
            const percent = computeProgress(path.materials, progress?.completed ?? []);
            const next = nextOpenMaterial(path, {
              started,
              completed: progress?.completed ?? [],
            });
            return (
              <SkillProgressCard
                key={skillId}
                skillId={skillId}
                name={path.skillName}
                description={path.subtitle}
                progress={percent}
                nextTitle={next?.title ?? null}
                onPress={() => openSkill(skillId)}
              />
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

/** Tombol "Jelajahi Skill" pada empty state, arah ke tab Explore. */
function SearchReset({ onGoToExplore }: { onGoToExplore: () => void }) {
  return (
    <View style={styles.exploreButtonWrap} pointerEvents="box-none">
      <ThemedText
        onPress={onGoToExplore}
        style={styles.exploreButton}
        accessibilityRole="button"
        accessibilityLabel="Jelajahi Skill"
      >
        Jelajahi Skill
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  emptyCaption: {
    textAlign: "center",
  },
  exploreButtonWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  exploreButton: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  skillList: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 24,
  },
  skillCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  skillCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  skillCardInfo: {
    flex: 1,
    gap: 3,
  },
  skillCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
  },
  ringPercent: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
  },
  skillCardStatus: {
    flex: 1,
    gap: 6,
  },
  continueHint: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
});
