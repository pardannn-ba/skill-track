import { StyleSheet, Text, type TextProps } from "react-native";
import { colors } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  /** Varian teks yang mengatur ukuran/berat default. */
  variant?:
    | "title" // judul besar "Selamat pagi!"
    | "subtitle" // teks kecil di bawah judul
    | "cardTitle" // judul di kartu
    | "body"
    | "caption" // teks kecil sekunder
    | "stat" // Angka persentase besar
    | "levelBadge"; // label kecil badge "Pemula";
  /** Timpa warna default (primaryText/secondaryText). */
  color?: string;
  /** Timpa ketebalan font default. */
  weight?: "400" | "500" | "600" | "700";
};

const variantStyles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.text,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  stat: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },
  levelBadge: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.levelText,
  },
});

/**
 * Teks dengan style default yang konsisten sesuai desain Skill-Track.
 */
export default function ThemedText({
  variant = "body",
  color,
  style,
  ...rest
}: ThemedTextProps) {
  const variantStyle = variantStyles[variant];
  const mergedColor = color !== undefined ? { color } : undefined;
  return (
    <Text
      style={[variantStyle, mergedColor, style]}
      {...rest}
    />
  );
}
