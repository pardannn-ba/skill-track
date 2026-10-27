import { StyleSheet, View, type DimensionValue } from "react-native";
import { colors } from "@/constants/theme";

export type ProgressBarProps = {
  /** Nilai progress dalam persen (0–100). */
  value: number;
  /** Warna fill progress bar (default: turquoise). */
  fillColor?: string;
  /** Warna track/bar belakang, default: biru lapis kartu. */
  trackColor?: string;
  /** Tinggi bar dalam piksel (default: 8). */
  height?: number;
  /** Lebar bar (default: 100%). */
  width?: DimensionValue;
};

/**
 * Progress bar horizontal. Panjang fill mengikuti persentase `value`.
 */
export default function ProgressBar({
  value,
  fillColor = colors.turquoise,
  trackColor = colors.blueLayer,
  height = 8,
  width = "100%",
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <View
      style={[
        styles.track,
        { height, width, backgroundColor: trackColor },
      ]}
    >
      {percent > 0 ? (
        <View
          style={[
            styles.fill,
            { width: `${percent}%` as `${number}%`, backgroundColor: fillColor, height },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 999,
  },
});
