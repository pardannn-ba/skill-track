import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";
import { colors } from "@/constants/theme";

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/**
 * Search bar kapsul dengan ikon kiri dan tombol clear opsional
 * (hanya muncul ketika ada teks yang diketik).
 */
export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Cari skill...",
}: SearchBarProps) {
  return (
    <View style={styles.wrap}>
      <Search size={18} color={colors.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        autoCapitalize="none"
        // suppressHighlighting tidak ada — cukup biarkan default
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          style={styles.clearButton}
          accessibilityRole="button"
          accessibilityLabel="Hapus teks pencarian"
        >
          <X size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    // Search bar kapsul: radius = setengah tinggi (44/2)
    backgroundColor: colors.searchBg,
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
