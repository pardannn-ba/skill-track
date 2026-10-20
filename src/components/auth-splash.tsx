import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import SkillTrackLogo from "@/components/skilltrack-logo";
import { colors } from "@/constants/theme";

/** Durasi total splash (dalam batas 1,5–2,5 detik). */
const MIN_DURATION_MS = 1900;

type Props = {
  /** Sesi login sudah selesai dibaca — splash baru boleh ditutup. */
  ready: boolean;
  /** Dipanggil saat splash selesai dan aplikasi boleh menampilkan tujuan. */
  onDone: () => void;
};

/**
 * Splash screen animasi pembuka SkillTrack.
 * Logo fade-in + scale-up, lalu nama aplikasi fade-in menyusul.
 * Menghormati preferensi reduced motion: animasi dilewati, tampil statis.
 */
export default function AuthSplash({ ready, onDone }: Props) {
  // Nilai animasi dibuat sekali via lazy-state (pola yang valid untuk
  // React Compiler — bukan useRef yang dibaca saat render).
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.85));
  const [nameOpacity] = useState(() => new Animated.Value(0));
  // Waktu mulai dibaca sekali saat mount; efek kelayakan menutup splash
  // yang memakai nilai ini hanya berjalan setelah interaksi/render aman.
  const [startedAt] = useState(() => Date.now());

  const [animDone, setAnimDone] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  // Preferensi reduced motion OS (hasil asinkron, bukan setState sinkron).
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotion(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Animasi pembuka (sekali), dijalankan setelah preferensi diketahui.
  useEffect(() => {
    if (reduceMotion === null) {
      return;
    }
    if (reduceMotion) {
      // Reduced motion: tampilkan komponen dalam kondisi akhir tanpa animasi.
      logoOpacity.setValue(1);
      logoScale.setValue(1);
      nameOpacity.setValue(1);
      return;
    }
    const logoAnim = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]);
    const nameAnim = Animated.timing(nameOpacity, {
      toValue: 1,
      duration: 450,
      delay: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const anim = Animated.parallel([logoAnim, nameAnim]);
    anim.start(({ finished }) => {
      if (finished) {
        setAnimDone(true);
      }
    });
    return () => {
      anim.stop();
    };
  }, [reduceMotion, logoOpacity, logoScale, nameOpacity]);

  // Splash selesai jika (animasi selesai ATAU reduced motion) DAN sesi
  // sudah dibaca; tahan agar total tampilan ~MIN_DURATION_MS.
  const presentationDone = reduceMotion === true || animDone;
  useEffect(() => {
    if (!presentationDone || !ready) {
      return;
    }
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, MIN_DURATION_MS - elapsed);
    const timer = setTimeout(onDone, wait);
    return () => clearTimeout(timer);
  }, [presentationDone, ready, startedAt, onDone]);

  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="Splash SkillTrack">
      <Animated.View
        style={{
          alignItems: "center",
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <SkillTrackLogo size={104} />
      </Animated.View>
      <Animated.Text style={[styles.appName, { opacity: nameOpacity }]}>
        SkillTrack
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.authBackground,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    // Elevasi agar tertutup di atas navigator di Android.
    elevation: 100,
  },
  appName: {
    marginTop: 18,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.4,
  },
});
