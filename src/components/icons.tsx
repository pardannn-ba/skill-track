import {
  Bell,
  Book,
  ChartColumn,
  ChevronRight,
  CircleUser,
  Home,
  Search,
  type LucideIcon,
} from "lucide-react-native";

type IconProps = {
  size?: number;
  color?: string;
};

/**
 * Ikon yang dipakai di aplikasi Skill-Track.
 * Semua ikon berasal dari lucide-react-native (butuh react-native-svg).
 */
export const BellIcon = ({ size = 24, color }: IconProps) => (
  <Bell size={size} color={color} />
);

export const BookIcon = ({ size = 24, color }: IconProps) => (
  <Book size={size} color={color} />
);

export const ChartIcon = ({ size = 24, color }: IconProps) => (
  <ChartColumn size={size} color={color} />
);

export const ChevronRightIcon = ({ size = 24, color }: IconProps) => (
  <ChevronRight size={size} color={color} />
);

export const HomeIcon = ({ size = 24, color }: IconProps) => (
  <Home size={size} color={color} />
);

export const SearchIcon = ({ size = 24, color }: IconProps) => (
  <Search size={size} color={color} />
);

export const ProfileIcon = ({ size = 24, color }: IconProps) => (
  <CircleUser size={size} color={color} />
);

export type { LucideIcon };
