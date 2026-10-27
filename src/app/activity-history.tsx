import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "@/constants/theme";
import {
  buildWeeklyActivity,
  formatActivityDate,
  readActivityTimestamps,
} from "@/data/profile";
import ThemedText from "@/components/ui/themed-text";

/**
 * Riwayat aktivitas belajar — dibuka dari tombol "Lihat semua"
 * pada kartu Aktivitas Mingguan di halaman Profil.
 * Menampilkan ringkasan 7 hari terakhir + daftar aktivitas per hari.
 */
export default function ActivityHistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<
    { timestamp: number; materialId: string }[]
  >([]);

  useEffect(() => {
    let isMounted = true;
    void readActivityTimestamps().then((stored) => {
      if (isMounted) {
        // Terbaru di atas.
        setEntries([...stored].reverse());
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Kelompokkan entri per hari (lokal) agar bisa menampilkan tanggalnya.
  const grouped = entries.reduce<
    { label: string; items: { timestamp: number; materialId: string }[] }[]
  >((acc, entry) => {
    const label = formatActivityDate(new Date(entry.timestamp));
    const last = acc[acc.length - 1];
    if (last && last.label === label) {
      last.items.push(entry);
    } else {
      acc.push({ label, items: [entry] });
    }
    return acc;
  }, []);

  const weekly = buildWeeklyActivity(entries);
  const total = entries.length;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          hitSlop={10}
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Kembali"
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Riwayat Aktivitas</ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ringkasan mingguan dengan desain yang sama seperti halaman Profil */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText variant="cardTitle">7 Hari Terakhir</ThemedText>
            <ThemedText variant="caption">{total} aktivitas</ThemedText>
          </View>
          <View style={styles.chartRow}>
            {weekly.map((day, index) => {
              // Skala dinamis: relatif terhadap hari teraktif agar batang
              // tidak pernah meluap keluar area kartu (bug tinggi > track).
              const scaleMax = Math.max(BAR_SCALE_MAX, ...weekly.map((d) => d.count), day.count);
              return (
              <View key={`${day.label}-${index}`} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height:
                          day.count > 0
                            ? Math.max(
                                10,
                                Math.round(
                                  (Math.min(day.count, scaleMax) / scaleMax) * BAR_MAX_HEIGHT,
                                ),
                              )
                            : 6,
                      },
                    ]}
                  />
                </View>
                <ThemedText variant="caption" style={styles.barLabel}>
                  {day.label}
                </ThemedText>
              </View>
              );
            })}
          </View>
        </View>

        {/* Daftar aktivitas per hari */}
        {grouped.length === 0 ? (
          <View style={styles.emptyWrap}>
            <ThemedText variant="cardTitle">Belum ada aktivitas</ThemedText>
            <ThemedText variant="caption" style={styles.emptyCaption}>
              Selesaikan materi di Learning Path untuk mulai mencatat
              aktivitas.
            </ThemedText>
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.label} style={styles.card}>
              <ThemedText variant="cardTitle">{group.label}</ThemedText>
              {group.items.map((entry, itemIndex) => (
                <View key={`${entry.materialId}-${itemIndex}`} style={styles.entryRow}>
                  <View style={styles.entryDot} />
                  <View style={styles.entryInfo}>
                    <ThemedText variant="body">Materi selesai</ThemedText>
                    <ThemedText variant="caption">
                      {new Date(entry.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Tinggi maksimum batang — sama dengan halaman Profil agar konsisten. */
const BAR_MAX_HEIGHT = 56;
/** Jumlah aktivitas yang dianggap penuh pada skala; hari di atasnya digambar penuh. */
const BAR_SCALE_MAX = 4;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    width: 18,
    alignSelf: "center",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    height: BAR_MAX_HEIGHT,
  },
  barFill: {
    width: "100%",
    borderRadius: 9,
    backgroundColor: colors.primary,
    overflow: "hidden",
  },
  barLabel: {
    fontSize: 12,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  entryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.turquoise,
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 6,
  },
  emptyCaption: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
