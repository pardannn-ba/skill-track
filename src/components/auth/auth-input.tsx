import { forwardRef, useState, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/constants/theme";
import type { IconProps } from "@/components/ui/icons";

type AuthInputProps = TextInputProps & {
  /** Ikon kiri (Mail/Lock/User dari components/icons). */
  icon: (props: IconProps) => ReactNode;
};

/**
 * Input standar halaman Login/Register: outline biru keabu-abuan,
 * background gelap, sudut membulat, ikon di kiri — konsisten untuk
 * semua field auth.
 */
const AuthInput = forwardRef<TextInput, AuthInputProps>(function AuthInput(
  { icon: Icon, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <Icon size={20} color={focused ? "#7FB0FF" : colors.textSecondary} />
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor={colors.textSecondary}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
});

export default AuthInput;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.authInputBorder,
    backgroundColor: colors.authInput,
    paddingHorizontal: 16,
  },
  wrapFocused: {
    borderColor: "#4E86E8",
  },
  input: {
    flex: 1,
    height: "100%",
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0, // tinggi sudah diatur wrap agar center vertikal
  },
});
