/**
 * AUTENTIKASI LOKAL SEMENTARA — khusus pengembangan / demo.
 *
 * ⚠️ BATASAN YANG HARUS DIPAHAMI:
 * - Sistem ini TIDAK terhubung ke database/server mana pun. Akun disimpan
 *   di AsyncStorage perangkat ini saja.
 * - Password disimpan dalam bentuk teks biasa (plaintext). Hal ini hanya
 *   bisa diterima karena murni untuk pengembangan lokal. JANGAN gunakan
 *   pola ini untuk produksi.
 * - Saat backend autentikasi tersedia, ganti isi fungsi `login`,
 *   `register`, `loadSession`, dan `logout` dengan panggilan API —
 *   tipe dan nama ekspornya sengaja dibuat agar halaman Login/Register
 *   tidak perlu diubah.
 *
 * Penyimpanan sengaja dipisah dari progress belajar (progress-store):
 * - Akun & sesi login  → AsyncStorage (persisten, selamat dari reload).
 * - Progress belajar   → in-memory sesi (kembali ke awal saat reload).
 * - Username profil    → tetap di usernameStorageKey (data/profile.ts).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

//
// Kunci penyimpanan
//

/** Daftar akun lokal (termasuk akun hasil register). */
export const accountsStorageKey = "@skill-track/auth/accounts/v1";

/** Sesi login aktif (null = belum login). */
export const sessionStorageKey = "@skill-track/auth/session/v1";

//
// Tipe
//

export type AuthSession = {
  /** Identifier yang dipakai saat login (username). */
  username: string;
  /** Nama lengkap pemilik akun. */
  fullName: string;
  /** Waktu login (epoch ms). */
  loggedInAt: number;
};

export type AuthAccount = {
  username: string;
  fullName: string;
  email: string;
  password: string; // plaintext — HANYA untuk demo lokal, lihat catatan di atas.
  createdAt: number;
};

export type AuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

export type RegisterResult = { ok: true } | { ok: false; error: string };

//
// Akun demo bawaan (belum terdaftar di storage — dicek langsung saat login)
//

export const DEMO_USERNAME = "admin123";
export const DEMO_PASSWORD = "admin123";
export const DEMO_FULL_NAME = "Admin SkillTrack";

//
// State sesi di memori — sumber tunggal selama aplikasi berjalan
//

let cache: AuthSession | null = null;
let ready = false;

type Listener = (session: AuthSession | null) => void;
const listeners = new Set<Listener>();

/** Subscribe perubahan sesi login; kembalikan fungsi berhenti berlangganan. */
export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) {
    listener(cache);
  }
}

//
// Helper storage
//

async function readAccounts(): Promise<AuthAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(accountsStorageKey);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuthAccount[]) : [];
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: AuthAccount[]): Promise<void> {
  await AsyncStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

//
// Sesi
//

/**
 * Baca sesi login tersimpan (sekali per aplikasi, lalu di-cache).
 * Dipanggil saat aplikasi mulai sebelum menentukan tujuan navigasi.
 */
export async function loadSession(): Promise<AuthSession | null> {
  if (ready) {
    return cache;
  }
  try {
    const raw = await AsyncStorage.getItem(sessionStorageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as AuthSession).username === "string"
    ) {
      cache = parsed as AuthSession;
    } else {
      cache = null;
    }
  } catch {
    cache = null;
  }
  ready = true;
  notify();
  return cache;
}

async function persistSession(session: AuthSession): Promise<void> {
  cache = session;
  try {
    await AsyncStorage.setItem(sessionStorageKey, JSON.stringify(session));
  } catch {
    // Gagal menulis storage tidak menggagalkan login di memori.
  }
  notify();
}

/** Akhir sesi login — kembali ke halaman Login. */
export async function logout(): Promise<void> {
  cache = null;
  try {
    await AsyncStorage.removeItem(sessionStorageKey);
  } catch {
    // Diabaikan: sesi sudah dihapus dari memori.
  }
  notify();
}

//
// Login
//

/**
 * Login lokal dengan username/email + password.
 * Mendukung akun demo `admin123` dan akun hasil register.
 */
export async function login(identifier: string, password: string): Promise<AuthResult> {
  const id = normalize(identifier);
  if (!id || !password) {
    return { ok: false, error: "Email/username dan password wajib diisi." };
  }

  // Akun demo bawaan.
  if (id === DEMO_USERNAME && password === DEMO_PASSWORD) {
    const session: AuthSession = {
      username: DEMO_USERNAME,
      fullName: DEMO_FULL_NAME,
      loggedInAt: Date.now(),
    };
    await persistSession(session);
    return { ok: true, session };
  }

  const accounts = await readAccounts();
  const account = accounts.find(
    (acc) => normalize(acc.username) === id || normalize(acc.email) === id,
  );
  if (account && account.password === password) {
    const session: AuthSession = {
      username: account.username,
      fullName: account.fullName,
      loggedInAt: Date.now(),
    };
    await persistSession(session);
    return { ok: true, session };
  }

  return {
    ok: false,
    error: "Email/username atau password salah. Periksa lalu coba lagi.",
  };
}

//
// Register
//

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterInput = {
  fullName: string;
  identifier: string; // username ATAU email
  password: string;
  confirmPassword: string;
};

/**
 * Validasi + simpan akun baru ke AsyncStorage lokal.
 * Tidak ada server yang dihubungi — murni penyimpanan perangkat.
 * Tidak otomatis login — pengguna diarahkan ke halaman Login.
 */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  const fullName = input.fullName.trim();
  const identifier = input.identifier.trim();
  const username = identifier; // pada form register, identifier dipakai sebagai username unik

  if (!fullName) {
    return { ok: false, error: "Nama lengkap wajib diisi." };
  }
  if (!identifier) {
    return { ok: false, error: "Email atau username wajib diisi." };
  }
  if (identifier.includes("@") && !EMAIL_REGEX.test(identifier)) {
    return { ok: false, error: "Format email tidak valid." };
  }
  if (!input.password) {
    return { ok: false, error: "Password wajib diisi." };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, error: "Password dan konfirmasi password tidak cocok." };
  }

  const accounts = await readAccounts();
  const taken = accounts.some((acc) => normalize(acc.username) === normalize(username));
  if (taken || normalize(username) === DEMO_USERNAME) {
    return { ok: false, error: "Username sudah digunakan. Pilih username lain." };
  }

  const isEmail = identifier.includes("@");
  const email = isEmail ? identifier : "";
  // Untuk identifier non-email, kolom email diisi placeholder agar unique check
  // email tetap sederhana; login menerima username ATAU email.
  const account: AuthAccount = {
    username,
    fullName,
    email,
    password: input.password, // plaintext — hanya untuk demo lokal
    createdAt: Date.now(),
  };
  accounts.push(account);
  try {
    await writeAccounts(accounts);
  } catch {
    return {
      ok: false,
      error: "Gagal menyimpan akun di perangkat ini. Coba lagi.",
    };
  }

  // Berhasil — tidak membuat sesi; pengguna harus login manual.
  return { ok: true };
}
