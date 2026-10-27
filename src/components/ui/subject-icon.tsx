import { StyleSheet, View } from "react-native";
import {
  Braces,
  FileCode2,
  Languages,
  Lightbulb,
  type LucideProps,
} from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { SkillIconName } from "@/data/skills";

export type SubjectIconProps = {
  name: SkillIconName;
  /** Ukuran kotak ikon (default 44). */
  size?: number;
};

const icons: Record<SkillIconName, React.ComponentType<LucideProps>> = {
  html: FileCode2,
  css: Braces,
  uiux: Lightbulb,
  english: Languages,
};

const boxColors: Record<SkillIconName, string> = {
  html: colors.html,
  css: colors.css,
  uiux: colors.uiux,
  english: colors.english,
};

/**
 * Kotak ikon berwarna (oranye HTML, biru CSS, ungu UI/UX, hijau English)
 * dengan glyph putih di tengah, sesuai desain referensi.
 */
export default function SubjectIcon({ name, size = 44 }: SubjectIconProps) {
  const Icon = icons[name];
  const radius = size * 0.24;
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: radius, backgroundColor: boxColors[name] },
      ]}
    >
      <Icon size={size * 0.55} color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    justifyContent: "center",
  },
});
