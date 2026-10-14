import { StyleSheet, View } from "react-native";
import ThemedText from "@/components/themed-text";
import { colors } from "@/constants/theme";

export default function Progress() {
  return (
    <View style={styles.container}>
      <ThemedText variant="cardTitle">Progress</ThemedText>
      <ThemedText variant="subtitle">Halaman Progress belum dibuat.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 20,
  },
});
