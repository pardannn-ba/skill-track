import {
  Bell,
  Book,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Home,
  Lock,
  LogOut,
  Mail,
  Search,
  Settings,
  SquareCheckBig,
  Star,
  User,
  X,
  type LucideIcon,
} from "lucide-react-native";

type IconProps = {
  size?: number;
  color?: string;
};

export type { IconProps };

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

/** Ikon panah kiri untuk tombol kembali di halaman Pengaturan. */
export const ChevronLeftIcon = ({ size = 24, color }: IconProps) => (
  <ChevronLeft size={size} color={color} />
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

/** Ikon pengaturan (gerigi) di header Profil. */
export const SettingsIcon = ({ size = 24, color }: IconProps) => (
  <Settings size={size} color={color} />
);

/** Ikon buku + tanda centang untuk statistik "Materi Selesai". */
export const BookCheckIcon = ({ size = 24, color }: IconProps) => (
  <SquareCheckBig size={size} color={color} />
);

/** Ikon bintang untuk statistik "Skill Aktif". */
export const StarIcon = ({ size = 24, color }: IconProps) => (
  <Star size={size} color={color} />
);

/** Ikon tutup (X) untuk modal pengaturan profil. */
export const CloseIcon = ({ size = 24, color }: IconProps) => (
  <X size={size} color={color} />
);

/** Ikon surat untuk input Email/Username pada halaman auth. */
export const MailIcon = ({ size = 24, color }: IconProps) => (
  <Mail size={size} color={color} />
);

/** Ikon gembok untuk input Password pada halaman auth. */
export const LockIcon = ({ size = 24, color }: IconProps) => (
  <Lock size={size} color={color} />
);

/** Ikon pengguna untuk input Nama Lengkap pada halaman register. */
export const UserIcon = ({ size = 24, color }: IconProps) => (
  <User size={size} color={color} />
);

/** Ikon keluar (logout) di halaman Profil. */
export const LogOutIcon = ({ size = 24, color }: IconProps) => (
  <LogOut size={size} color={color} />
);

export type { LucideIcon };
