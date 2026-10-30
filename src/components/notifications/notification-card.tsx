import { useEffect, useState, type ReactElement } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import ThemedText from "@/components/ui/themed-text";
import {
  CalendarIcon,
  ClockIcon,
  GraduationCapIcon,
  TrophyIcon,
  type IconProps,
} from "@/components/ui/icons";
import {
  notificationCategoryStyles,
  type NotificationIconName,
  type NotificationItem,
} from "@/data/notifications";

/** Peta nama ikon notifikasi → komponen ikon (semua dari lucide). */
const notificationIcons: Record<
  NotificationIconName,
  (props: IconProps) => ReactElement
> = {
  calendar: CalendarIcon,
  clock: ClockIcon,
  cap: GraduationCapIcon,
  trophy: TrophyIcon,
};

type NotificationCardProps = {
  notification: NotificationItem;
  /** Urutan kartu di daftar — dipakai untuk stagger animation. */
  index: number;
  /** Dipanggil saat kartu ditekan (menandai notifikasi sudah dibaca). */
  onPress: (id: string) => void;
};

/**
 * Satu kartu notifikasi: ikon kategori, judul, deskripsi, waktu, dan titik
 * biru untuk notifikasi yang belum dibaca. Kartu muncul dengan animasi
 * kecil (fade + naik) yang di-stagger sesuai urutannya.
 */
export default function NotificationCard({
  notification,
  index,
  onPress,
}: NotificationCardProps) {
  const [appear] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const anim = Animated.timing(appear, {
      toValue: 1,
      duration: 260,
      // Stagger: kartu berikutnya menyusul ~45ms; dibatasi agar daftar
      // panjang tidak terasa lambat.
      delay: Math.min(index, 6) * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
    };
  }, [appear, index]);

  const category = notificationCategoryStyles[notification.category];
  const Icon = notificationIcons[notification.icon];
  const unread = !notification.isRead;

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => onPress(notification.id)}
        style={({ pressed }) => [
          styles.card,
          unread ? styles.cardUnread : styles.cardRead,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}. ${notification.description}. ${notification.createdAt}${unread ? ". Belum dibaca" : ". Sudah dibaca"}`}
        accessibilityHint={
          unread ? "Tekan untuk menandai notifikasi sudah dibaca" : undefined
        }
      >
        <View style={[styles.iconBox, { backgroundColor: category.background }]}>
          <Icon size={20} color={category.accent} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText
              variant="cardTitle"
              style={[styles.title, unread ? null : styles.titleRead]}
            >
              {notification.title}
            </ThemedText>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>

          <ThemedText
            variant="caption"
            style={[styles.description, unread ? null : styles.descriptionRead]}
          >
            {notification.description}
          </ThemedText>

          <View style={styles.metaRow}>
            <ThemedText variant="caption" style={styles.time}>
              {notification.createdAt}
            </ThemedText>
            <View style={[styles.categoryChip, { borderColor: category.accent }]}>
              <ThemedText
                variant="caption"
                style={[styles.categoryText, { color: category.accent }]}
              >
                {category.label}
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  cardUnread: {
    // Latar sedikit lebih terang untuk notifikasi yang belum dibaca.
    backgroundColor: "#0F2A47",
    borderColor: "#1E4570",
  },
  cardRead: {
    backgroundColor: "#0A1C33",
    borderColor: "#17304C",
  },
  cardPressed: {
    opacity: 0.82,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  titleRead: {
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1877F2",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: "#B2C4DA",
  },
  descriptionRead: {
    color: "#7F93AC",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 8,
  },
  time: {
    fontSize: 11,
    lineHeight: 16,
    color: "#7F93AC",
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  categoryText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
});
