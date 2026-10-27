import { Tabs, usePathname } from "expo-router";
import { colors } from "@/constants/theme";
import {
  ChartIcon,
  HomeIcon,
  ProfileIcon,
  SearchIcon,
} from "@/components/ui/icons";
import ThemedText from "@/components/ui/themed-text";
import type { ReactNode } from "react";
import type { ColorValue } from "react-native";

type TabBarIconProps = {
  focused: boolean;
  color: ColorValue;
  size: number;
  Icon: (props: { size?: number; color?: string }) => ReactNode;
  /** Paksa tampil aktif (mis. tab Progress saat halaman Learning Path terbuka). */
  active?: boolean;
};

function TabBarIcon({ focused, color, size, Icon, active }: TabBarIconProps) {
  const isActive = focused || active === true;
  return <Icon size={size} color={isActive ? colors.primary : String(color)} />;
}

function TabBarLabel(props: {
  focused: boolean;
  color: ColorValue;
  children: string;
  active?: boolean;
}) {
  const { focused, color, children, active } = props;
  const isActive = focused || active === true;
  return (
    <ThemedText
      variant="caption"
      color={isActive ? colors.primary : String(color)}
      style={{ fontSize: 11 }}
    >
      {children}
    </ThemedText>
  );
}

const inactiveColor = colors.textSecondary;

/**
 *Navigasi bawah aplikasi: Home, Explore, Progress, Profil.
 * Latar bar-nya menyatu dengan background agar tampak menempel di bawah layar.
 */
export default function TabLayout() {
  // Halaman Learning Path adalah layar tersembunyi di dalam tab ini;
  // saat terbuka, tab Progress ditampilkan sebagai tab aktif (biru).
  const pathname = usePathname();
  const onLearningPath = pathname === "/learning-path";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: (props) => (
            <TabBarIcon {...props} Icon={HomeIcon} />
          ),
          tabBarLabel: (props) => <TabBarLabel {...props}>Home</TabBarLabel>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: (props) => (
            <TabBarIcon {...props} Icon={SearchIcon} />
          ),
          tabBarLabel: (props) => <TabBarLabel {...props}>Explore</TabBarLabel>,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: (props) => (
            <TabBarIcon {...props} Icon={ChartIcon} active={onLearningPath} />
          ),
          tabBarLabel: (props) => (
            <TabBarLabel {...props} active={onLearningPath}>
              Progress
            </TabBarLabel>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: (props) => (
            <TabBarIcon {...props} Icon={ProfileIcon} />
          ),
          tabBarLabel: (props) => <TabBarLabel {...props}>Profil</TabBarLabel>,
        }}
      />
      {/* Detail skill Learning Path: tidak tampil sebagai tab,
          tapi tetap berada di navigator yang sama agar bottom navigation
          (Home, Explore, Progress, Profil) tetap tampil di halaman ini. */}
      <Tabs.Screen
        name="learning-path"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
