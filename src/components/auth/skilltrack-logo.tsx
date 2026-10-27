import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = {
  /** Ukuran logo dalam px (persegi). */
  size?: number;
};

/**
 * Logo SkillTrack — rekonstruksi vektor dari referensi desain:
 * panah melingkar biru (pertumbuhan) mengelilingi lingkaran teal
 * berisi batang grafik. Tidak butuh aset gambar eksternal.
 */
export default function SkillTrackLogo({ size = 88 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Logo SkillTrack">
      {/* Panah melingkar biru: dari bawah-kiri, melengkung ke atas kanan */}
      <Path
        d="M18.9 71.8 A38 38 0 0 1 79.1 25.6"
        stroke="#2F86F6"
        strokeWidth={11}
        strokeLinecap="round"
        fill="none"
      />
      {/* Kepala panah ↗ di ujung lengkung */}
      <Path d="M92 12.6 L84.4 30.9 L73.8 20.3 Z" fill="#2F86F6" />

      {/* Lingkaran teal dengan grafik putih */}
      <Circle cx={44} cy={58} r={24} fill="#2DD4BF" />
      {/* Batang grafik */}
      <Rect x={32} y={61} width={6} height={9} rx={2.5} fill="#FFFFFF" />
      <Rect x={41} y={57} width={6} height={13} rx={2.5} fill="#FFFFFF" />
      <Rect x={50} y={52} width={6} height={18} rx={2.5} fill="#FFFFFF" />
      {/* Garis tren naik + panah kecil */}
      <Path
        d="M31 55 L40 49 L47 52 L56 43"
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M59 40 L58.8 45.8 L53.2 40.2 Z" fill="#FFFFFF" />
    </Svg>
  );
}
