import { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import ThemedText from "@/components/ui/themed-text";
import { CheckAllIcon, CloseIcon, TrashIcon } from "@/components/ui/icons";
import NotificationCard from "@/components/notifications/notification-card";
import {
  countUnread,
  type NotificationItem,
} from "@/data/notifications";

type NotificationPopupProps = {
  visible: boolean;
  notifications: readonly NotificationItem[];
  /** Dipanggil setelah animasi tutup selesai. */
  onClose: () => void;
  /** Menandai satu notifikasi sudah dibaca. */
  onRead: (id: string) => void;
  /** Menandai seluruh notifikasi sudah dibaca. */
  onMarkAllRead: () => void;
  /** Menghapus semua notifikasi simulasi (sudah lewat konfirmasi). */
  onDeleteAll: () => void;
};

const OVERLAY_COLOR = "rgba(2, 8, 18, 0.72)";

/**
 * Pop-up notifikasi Dashboard — muncul di bawah ikon lonceng tanpa
 * berpindah halaman.
 *
 * Animasi: overlay fade-in, container scale-up + slide-down, dan kartu
 * notifikasi muncul bergantian (stagger). Semua animasi memakai
 * React Native Animated API (sudah dipakai di splash) dan dihentikan
 * saat komponen dilepas agar tidak ada animasi/timer yang tertinggal.
 */
export default function NotificationPopup({
  visible,
  notifications,
  onClose,
  onRead,
  onMarkAllRead,
  onDeleteAll,
}: NotificationPopupProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Modal tetap ter-mount selama animasi tutup berjalan (visible masih true
  // dari parent), sehingga fade-out bisa selesai sebelum modal dilepas.
  const [closing, setClosing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const mounted = visible || closing;

  // Nilai animasi dibuat sekali (pola lazy state, sama seperti auth-splash).
  const [overlayOpacity] = useState(() => new Animated.Value(0));
  const [cardOpacity] = useState(() => new Animated.Value(0));
  const [cardScale] = useState(() => new Animated.Value(0.94));
  const [cardOffset] = useState(() => new Animated.Value(-14));

  // Animasi masuk setiap kali popup dibuka.
  useEffect(() => {
    if (!visible) {
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardOffset, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [visible, overlayOpacity, cardOpacity, cardScale, cardOffset]);

  // Tutup: animasi fade-out dulu, lalu lepas modal.
  const handleClose = useCallback(() => {
    if (!mounted || closing) {
      return;
    }
    setClosing(true);
    const anim = Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.97,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardOffset, {
        toValue: -8,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start(() => {
      // Reset agar popup selalu terbuka dalam kondisi segar.
      setClosing(false);
      setConfirmingDelete(false);
      onClose();
    });
  }, [
    mounted,
    closing,
    overlayOpacity,
    cardOpacity,
    cardScale,
    cardOffset,
    onClose,
  ]);

  const unreadCount = countUnread(notifications);
  const showEmptyState = unreadCount === 0;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable
            style={styles.overlayPress}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Tutup notifikasi"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              marginTop: insets.top + 56,
              // Jangan memenuhi layar; sisakan ruang di bawah untuk tab bar.
              maxHeight: Math.max(260, height - insets.top - insets.bottom - 96),
              opacity: cardOpacity,
              transform: [
                { translateY: cardOffset },
                { scale: cardScale },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <ThemedText variant="cardTitle" style={styles.title}>
                  Notifikasi
                </ThemedText>
                {unreadCount > 0 ? (
                  <View style={styles.countBadge}>
                    <ThemedText style={styles.countBadgeText}>
                      {unreadCount}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText variant="caption" style={styles.subtitle}>
                Jangan lewatkan progres belajarmu!
              </ThemedText>
            </View>

            <Pressable
              onPress={handleClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tutup notifikasi"
            >
              <CloseIcon size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Ringkasan + aksi tandai semua dibaca */}
          <View style={styles.actionsRow}>
            <ThemedText variant="caption" style={styles.unreadLabel}>
              {unreadCount > 0
                ? `${unreadCount} belum dibaca`
                : "Semua sudah dibaca"}
            </ThemedText>
            <Pressable
              onPress={onMarkAllRead}
              disabled={unreadCount === 0}
              hitSlop={6}
              style={({ pressed }) => [
                styles.markAllButton,
                pressed && styles.pressed,
                unreadCount === 0 && styles.markAllDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tandai semua dibaca"
            >
              <CheckAllIcon
                size={14}
                color={unreadCount > 0 ? "#60A5FA" : colors.textSecondary}
              />
              <ThemedText
                variant="caption"
                style={[
                  styles.markAllText,
                  unreadCount === 0 && styles.markAllTextDisabled,
                ]}
              >
                Tandai semua dibaca
              </ThemedText>
            </Pressable>
          </View>

          {/* Daftar notifikasi / empty state */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {showEmptyState ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <CheckAllIcon size={26} color={colors.turquoise} />
                </View>
                <ThemedText variant="cardTitle" style={styles.emptyTitle}>
                  Semua sudah dibaca!
                </ThemedText>
                <ThemedText variant="caption" style={styles.emptyText}>
                  Kamu tidak memiliki notifikasi baru.
                </ThemedText>
              </View>
            ) : (
              notifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onPress={onRead}
                />
              ))
            )}
          </ScrollView>

          {/* Footer: hapus semua (dengan konfirmasi) */}
          {notifications.length > 0 ? (
            <View style={styles.footer}>
              {confirmingDelete ? (
                <View style={styles.confirmRow}>
                  <ThemedText variant="caption" style={styles.confirmText}>
                    Hapus semua notifikasi?
                  </ThemedText>
                  <Pressable
                    onPress={() => setConfirmingDelete(false)}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.confirmCancel,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Batal menghapus notifikasi"
                  >
                    <ThemedText variant="caption" style={styles.confirmCancelText}>
                      Batal
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      onDeleteAll();
                      setConfirmingDelete(false);
                    }}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.confirmDelete,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Ya, hapus semua notifikasi"
                  >
                    <ThemedText variant="caption" style={styles.confirmDeleteText}>
                      Hapus
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setConfirmingDelete(true)}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Hapus semua notifikasi"
                >
                  <TrashIcon size={14} color="#F87171" />
                  <ThemedText variant="caption" style={styles.deleteText}>
                    Hapus semua
                  </ThemedText>
                </Pressable>
              )}
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: OVERLAY_COLOR,
  },
  overlayPress: {
    flex: 1,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: colors.card,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 13,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  unreadLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 2,
  },
  markAllDisabled: {
    opacity: 0.55,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#60A5FA",
  },
  markAllTextDisabled: {
    color: colors.textSecondary,
  },
  list: {
    flexShrink: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 2,
    paddingTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 6,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45, 212, 191, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(45, 212, 191, 0.3)",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F87171",
  },
  confirmRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confirmText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  confirmCancel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.authInputBorder,
  },
  confirmCancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  confirmDelete: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(248, 113, 113, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.45)",
  },
  confirmDeleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F87171",
  },
  pressed: {
    opacity: 0.75,
  },
});
