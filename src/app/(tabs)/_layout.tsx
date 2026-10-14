import { Tabs } from "expo-router";
import { colors } from "@/constants/theme";
import {
  ChartIcon,
  HomeIcon,
  ProfileIcon,
  SearchIcon,
} from "@/components/icons";
import ThemedText from "@/components/themed-text";
import type { ReactNode } from "react";
import type { ColorValue } from "react-native";

type TabBarIconProps = {
  focused: boolean;
  color: ColorValue;
  size: number;
  Icon: (props: { size?: number; color?: string }) => ReactNode;
};

function TabBarIcon({ focused, color, size, Icon }: TabBarIconProps) {
  return <Icon size={size} color={focused ? colors.primary : String(color)} />;
}

function TabBarLabel(props: {
  focused: boolean;
  color: ColorValue;
  children: string;
}) {
  const { focused, color, children } = props;
  return (
    <ThemedText
      variant="caption"
      color={focused ? colors.primary : String(color)}
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
            <TabBarIcon {...props} Icon={ChartIcon} />
          ),
          tabBarLabel: (props) => <TabBarLabel {...props}>Progress</TabBarLabel>,
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
    </Tabs>
  );
}
