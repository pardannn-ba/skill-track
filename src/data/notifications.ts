/**
 * NOTIFIKASI LOKAL — data simulasi (belum ada backend).
 *
 * ⚠️ Semua notifikasi di file ini adalah data contoh yang di-hardcode untuk
 * pengembangan UI. TIDAK ada server, database, Supabase, atau Firebase yang
 * mengirim notifikasi ini. Saat backend tersedia, ganti `seedNotifications`
 * dengan data dari API — tipe `NotificationItem` sengaja dibuat agar
 * komponen UI tidak perlu diubah.
 *
 * Status yang disimpan perangkat (AsyncStorage) hanya `readIds` &
 * `removedIds` — tidak ada data sensitif.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Kategori notifikasi sesuai aktivitas belajar pengguna. */
export type NotificationCategory =
  | "daily-reminder" // Pengingat Belajar Harian
  | "learning-progress" // Progres Belajar
  | "learning-activity" // Aktivitas Belajar
  | "achievement"; // Achievement

/** Nama ikon notifikasi (dipetakan ke komponen ikon di NotificationCard). */
export type NotificationIconName = "calendar" | "clock" | "cap" | "trophy";

export type NotificationItem = {
  /** Id unik notifikasi. */
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  /** Label waktu siap tampil, mis. "Hari ini, 09:00". */
  createdAt: string;
  isRead: boolean;
  icon: NotificationIconName;
};

/** Label + warna aksen tiap kategori (dipakai chip kategori di kartu). */
export const notificationCategoryStyles: Record<
  NotificationCategory,
  { label: string; accent: string; background: string }
> = {
  "daily-reminder": {
    label: "Pengingat Harian",
    accent: "#38BDF8",
    background: "#0C2C46",
  },
  "learning-progress": {
    label: "Progres Belajar",
    accent: "#2DD4BF",
    background: "#0B332F",
  },
  "learning-activity": {
    label: "Aktivitas Belajar",
    accent: "#818CF8",
    background: "#1B2347",
  },
  achievement: {
    label: "Achievement",
    accent: "#FBBF24",
    background: "#33280E",
  },
};

/**
 * Contoh notifikasi awal (urut terbaru → terlama).
 * `isRead: false` menampilkan titik biru + latar kartu lebih terang.
 */
export const seedNotifications: readonly NotificationItem[] = [
  {
    id: "notif-daily-reminder",
    title: "Waktunya Belajar! 📚",
    description:
      "Jangan lupa luangkan waktu untuk mengembangkan skill kamu hari ini.",
    category: "daily-reminder",
    createdAt: "Hari ini, 09:00",
    isRead: false,
    icon: "calendar",
  },
  {
    id: "notif-incomplete-material",
    title: "Belajar Belum Selesai",
    description:
      "Kamu masih memiliki materi Web Development yang belum diselesaikan. Yuk, lanjutkan progresmu!",
    category: "learning-progress",
    createdAt: "Hari ini, 07:30",
    isRead: false,
    icon: "clock",
  },
  {
    id: "notif-continue-material",
    title: "Lanjutkan Pembelajaranmu",
    description:
      "Materi JavaScript kamu masih belum selesai. Selesaikan materi berikutnya untuk meningkatkan progres skill.",
    category: "learning-activity",
    createdAt: "Kemarin, 18:30",
    isRead: false,
    icon: "cap",
  },
  {
    id: "notif-achievement",
    title: "Terus Tingkatkan Skill!",
    description:
      "Terus konsisten belajar dan kumpulkan pencapaian baru di Skill Track.",
    category: "achievement",
    createdAt: "Kemarin, 10:15",
    isRead: true,
    icon: "trophy",
  },
];

/** Kunci penyimpanan status notifikasi di perangkat ini. */
export const notificationsStorageKey = "@skill-track/notifications/v1";

/** Status notifikasi yang persisten: sudah dibaca & sudah dihapus. */
export type NotificationState = {
  readIds: readonly string[];
  removedIds: readonly string[];
};

export const emptyNotificationState: NotificationState = {
  readIds: [],
  removedIds: [],
};

const idSet = (ids: readonly string[]): Set<string> => new Set(ids);

/** Gabungkan data simulasi dengan status baca/hapus yang tersimpan. */
export function applyNotificationState(
  items: readonly NotificationItem[],
  state: NotificationState,
): NotificationItem[] {
  const readIds = idSet(state.readIds);
  const removedIds = idSet(state.removedIds);
  return items
    .filter((item) => !removedIds.has(item.id))
    .map((item) => ({
      ...item,
      isRead: item.isRead || readIds.has(item.id),
    }));
}

/** Jumlah notifikasi yang belum dibaca. */
export function countUnread(items: readonly NotificationItem[]): number {
  return items.filter((item) => !item.isRead).length;
}

/** Baca status notifikasi dari perangkat; state kosong bila belum ada. */
export async function loadNotificationState(): Promise<NotificationState> {
  try {
    const raw = await AsyncStorage.getItem(notificationsStorageKey);
    if (!raw) {
      return emptyNotificationState;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return emptyNotificationState;
    }
    const record = parsed as Record<string, unknown>;
    const readIds = Array.isArray(record.readIds)
      ? record.readIds.filter((id): id is string => typeof id === "string")
      : [];
    const removedIds = Array.isArray(record.removedIds)
      ? record.removedIds.filter((id): id is string => typeof id === "string")
      : [];
    return { readIds, removedIds };
  } catch {
    return emptyNotificationState;
  }
}

/** Simpan status notifikasi; kegagalan storage tidak boleh mengganggu UI. */
export async function saveNotificationState(
  state: NotificationState,
): Promise<void> {
  try {
    await AsyncStorage.setItem(notificationsStorageKey, JSON.stringify(state));
  } catch {
    // Diabaikan: status tetap berlaku di memori selama aplikasi berjalan.
  }
}
