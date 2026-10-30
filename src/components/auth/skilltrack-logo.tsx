import { Image, StyleSheet, View } from "react-native";

/**
 * Aset logo resmi Skill Track (mark + wordmark) dari
 * `assets/images/skilltrack-logo.png`. Satu aset dipakai bersama oleh
 * halaman Login, Register, dan splash sehingga tampilannya konsisten.
 *
 * Gambar tidak pernah diregangkan: rasio asli dipertahankan dan
 * `resizeMode="contain"` menjaga proporsi logo.
 */
const LOGO_SOURCE = require("../../../assets/images/skilltrack-logo.svg");

/** Rasio asli file logo (600 × 400). */
const LOGO_ASPECT_RATIO = 600 / 400;

type Props = {
  /** Lebar logo dalam px; tinggi mengikuti rasio asli. */
  size?: number;
  /**
   * Tampilkan pelat latar terang di belakang logo. Diperlukan karena
   * wordmark logo berwarna gelap, sementara halaman auth berlatar navy.
   */
  plate?: boolean;
};

export default function SkillTrackLogo({ size = 190, plate = true }: Props) {
  const width = size;
  const height = Math.round(size / LOGO_ASPECT_RATIO);
  const padding = Math.round(size * 0.075);

  return (
    <View
      style={[
        styles.container,
        plate && styles.plate,
        { paddingHorizontal: plate ? padding * 1.6 : 0, paddingVertical: plate ? padding : 0 },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Logo Skill Track"
    >
      <Image
        source={LOGO_SOURCE}
        style={{ width, height }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  plate: {
    // backgroundColor: "#FFFFFF",
    // borderRadius: 24,
    // borderWidth: 1,
    // borderColor: "rgba(255, 255, 255, 0.12)",
  },
});
