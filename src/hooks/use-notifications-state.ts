import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyNotificationState,
  countUnread,
  emptyNotificationState,
  loadNotificationState,
  saveNotificationState,
  seedNotifications,
  type NotificationItem,
  type NotificationState,
} from "@/data/notifications";

export type NotificationsState = {
  /** Notifikasi yang masih ada, sudah digabung dengan status baca. */
  notifications: NotificationItem[];
  /** Jumlah notifikasi yang belum dibaca (otomatis ikut berubah). */
  unreadCount: number;
  /** true setelah status tersimpan selesai dibaca dari perangkat. */
  ready: boolean;
  /** Tandai satu notifikasi sudah dibaca. */
  markAsRead: (id: string) => void;
  /** Tandai seluruh notifikasi sudah dibaca. */
  markAllAsRead: () => void;
  /** Hapus semua notifikasi simulasi (dipanggil setelah konfirmasi). */
  removeAll: () => void;
};

/**
 * State notifikasi lokal: daftar, status baca, dan jumlah belum dibaca.
 * Semua perubahan langsung terlihat di UI (tanpa membuka ulang popup) dan
 * disimpan di AsyncStorage perangkat supaya tidak kembali ke kondisi awal
 * saat aplikasi dibuka ulang. Tidak ada backend yang terlibat.
 */
export function useNotificationsState(): NotificationsState {
  const [state, setState] = useState<NotificationState>(emptyNotificationState);
  const [ready, setReady] = useState(false);

  // Baca status tersimpan sekali saat mount.
  useEffect(() => {
    let isMounted = true;
    void loadNotificationState().then((stored) => {
      if (!isMounted) {
        return;
      }
      setState(stored);
      setReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Simpan setiap perubahan (setelah pembacaan awal selesai).
  useEffect(() => {
    if (!ready) {
      return;
    }
    void saveNotificationState(state);
  }, [ready, state]);

  const markAsRead = useCallback((id: string) => {
    setState((prev) =>
      prev.readIds.includes(id)
        ? prev
        : { ...prev, readIds: [...prev.readIds, id] },
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setState((prev) => {
      const next = new Set([...prev.readIds, ...seedNotifications.map((n) => n.id)]);
      return { ...prev, readIds: [...next] };
    });
  }, []);

  const removeAll = useCallback(() => {
    setState((prev) => ({
      readIds: prev.readIds,
      removedIds: [...new Set([...prev.removedIds, ...seedNotifications.map((n) => n.id)])],
    }));
  }, []);

  const notifications = useMemo(
    () => applyNotificationState(seedNotifications, state),
    [state],
  );

  const unreadCount = useMemo(() => countUnread(notifications), [notifications]);

  return {
    notifications,
    unreadCount,
    ready,
    markAsRead,
    markAllAsRead,
    removeAll,
  };
}
