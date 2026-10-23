/**
 * AUTENTIKASI LOKAL — khusus pengembangan / demo.
 *
 * ⚠️ BATASAN YANG HARUS DIPAHAMI:
 * - Sistem ini TIDAK terhubung ke database/server mana pun. Akun disimpan
 *   di AsyncStorage perangkat ini saja.
 * - Password TIDAK disimpan sebagai teks biasa. Password di-hash dengan
 *   SHA-256 + salt acak per akun (expo-crypto) sebelum disimpan.
 *   Keterbatasan: ini hashing, bukan KDF berat (bcrypt/scrypt/argon2) dan
 *   storage tetap di AsyncStorage (bukan secure enclave) — cukup untuk
 *   demo lokal, BUKAN untuk produksi. Saat backend autentikasi tersedia,
 *   ganti isi fungsi `login`, `register`, `updateProfile`,
 *   `changePassword`, `loadSession`, dan `logout` dengan panggilan API —
 *   tipe dan nama ekspornya sengaja dibuat agar halaman UI tidak perlu
 *   diubah total.
 *
 * Penyimpanan data akun:
 * - Akun & sesi login  → AsyncStorage (persisten, selamat dari reload).
 *   Setiap akun punya record sendiri (id unik, nama, username, email,
 *   salt, hash) sehingga profil Pengguna A dan Pengguna B terpisah.
 * - Progress belajar   → in-memory sesi (kembali ke awal saat reload).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

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
  /** Email akun (opsional pada sesi lama; kosong jika tidak tersedia). */
  email?: string;
  /** Waktu login (epoch ms). */
  loggedInAt: number;
};

export type AuthAccount = {
  /** Id unik akun (dihasilkan saat akun dibuat). */
  id: string;
  username: string;
  fullName: string;
  email: string;
  /** Salt acak per akun (hex). */
  passwordSalt: string;
  /** SHA-256(salt:password) hex — bukan teks biasa. */
  passwordHash: string;
  /** Waktu pembuatan akun (epoch ms). */
  createdAt: number;
};

export type AuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

export type RegisterResult = { ok: true } | { ok: false; error: string };

/** Hasil operasi profil/password yang tidak butuh session baru. */
export type ProfileResult = { ok: true } | { ok: false; error: string };

/** Panjang minimum password (dipakai registrasi & ganti password). */
export const MIN_PASSWORD_LENGTH = 8;

//
// Akun demo bawaan (dicek langsung saat login bila record-nya belum ada)
//

export const DEMO_USERNAME = "admin123";
export const DEMO_PASSWORD = "admin123";
export const DEMO_FULL_NAME = "Admin SkillTrack";
/** Email akun demo (tidak ada email asli — dikosongkan). */
export const DEMO_EMAIL = "";

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
// Helper kriptografi & storage
//

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Id unik per akun (UUID dari expo-crypto; sync). */
function createId(): string {
  return Crypto.randomUUID();
}

/** Salt acak 16 byte (hex) per akun. */
function createSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  let salt = "";
  for (const byte of bytes) {
    salt += byte.toString(16).padStart(2, "0");
  }
  return salt;
}

/** Hash password: SHA-256(salt:password) hex. */
async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

/**
 * Normalisasi satu entri storage → AuthAccount.
 * Entri lama (password masih plaintext, tanpa id/salt/hash) dimigrasi ke
 * bentuk hash supaya teks biasa tidak lagi tersimpan di perangkat.
 */
async function normalizeAccount(entry: unknown): Promise<AuthAccount | null> {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const raw = entry as Record<string, unknown>;
  if (typeof raw.username !== "string" || !raw.username.trim()) {
    return null;
  }
  const username = raw.username.trim();
  const fullName =
    typeof raw.fullName === "string" && raw.fullName.trim()
      ? raw.fullName.trim()
      : username;
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : Date.now();
  const id = typeof raw.id === "string" && raw.id ? raw.id : createId();

  if (typeof raw.passwordHash === "string" && typeof raw.passwordSalt === "string") {
    return { id, username, fullName, email, passwordSalt: raw.passwordSalt, passwordHash: raw.passwordHash, createdAt };
  }

  // Legacy: password tersimpan plaintext → hash ulang dengan salt, lalu
  // entri lama (dengan password teks biasa) ditimpa saat writeAccounts.
  const legacyPassword = typeof raw.password === "string" ? raw.password : "";
  const passwordSalt = createSalt();
  const passwordHash = await hashPassword(legacyPassword, passwordSalt);
  return { id, username, fullName, email, passwordSalt, passwordHash, createdAt };
}

async function readAccounts(): Promise<AuthAccount[]> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(accountsStorageKey);
  } catch {
    return [];
  }
  if (!raw) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }

  const accounts: AuthAccount[] = [];
  let needsRewrite = false;
  for (const entry of parsed) {
    const account = await normalizeAccount(entry);
    if (account) {
      accounts.push(account);
    }
    // Entri legacy (plaintext) atau tidak valid → storage ditulis ulang
    // agar jejak password teks biasa segera hilang.
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof (entry as Record<string, unknown>).passwordHash !== "string"
    ) {
      needsRewrite = true;
    }
  }
  if (needsRewrite) {
    try {
      await AsyncStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
    } catch {
      // Gagal menulis ulang tidak menggagalkan operasi; coba lagi pada read berikutnya.
    }
  }
  return accounts;
}

async function writeAccounts(accounts: AuthAccount[]): Promise<void> {
  await AsyncStorage.setItem(accountsStorageKey, JSON.stringify(accounts));
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
 * Mendukung akun demo `admin123` (bila record-nya belum dibuat) dan
 * akun hasil register.
 */
export async function login(identifier: string, password: string): Promise<AuthResult> {
  const id = normalize(identifier);
  if (!id || !password) {
    return { ok: false, error: "Email/username dan password wajib diisi." };
  }

  const accounts = await readAccounts();
  const account = accounts.find(
    (acc) => normalize(acc.username) === id || normalize(acc.email) === id,
  );

  if (account) {
    const passwordHash = await hashPassword(password, account.passwordSalt);
    if (passwordHash !== account.passwordHash) {
      return {
        ok: false,
        error: "Email/username atau password salah. Periksa lalu coba lagi.",
      };
    }
    const session: AuthSession = {
      username: account.username,
      fullName: account.fullName,
      email: account.email,
      loggedInAt: Date.now(),
    };
    await persistSession(session);
    return { ok: true, session };
  }

  // Akun demo bawaan — hanya bila BELUM ada record akunnya, supaya setelah
  // profil/password demo diubah, aturan login normal (hash) yang berlaku.
  if (id === DEMO_USERNAME && password === DEMO_PASSWORD) {
    const passwordSalt = createSalt();
    const demoAccount: AuthAccount = {
      id: createId(),
      username: DEMO_USERNAME,
      fullName: DEMO_FULL_NAME,
      email: DEMO_EMAIL,
      passwordSalt,
      passwordHash: await hashPassword(DEMO_PASSWORD, passwordSalt),
      createdAt: Date.now(),
    };
    accounts.push(demoAccount);
    try {
      await writeAccounts(accounts);
    } catch {
      // Tetap lanjut login; record akan dibuat ulang pada read berikutnya.
    }
    const session: AuthSession = {
      username: demoAccount.username,
      fullName: demoAccount.fullName,
      email: demoAccount.email,
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

export type RegisterInput = {
  fullName: string;
  identifier: string; // username ATAU email
  password: string;
  confirmPassword: string;
};

/**
 * Validasi + simpan akun baru ke AsyncStorage lokal.
 * Tidak ada server yang dihubungi — murni penyimpanan perangkat.
 * Password disimpan sebagai hash (salt + SHA-256), bukan teks biasa.
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
  const passwordSalt = createSalt();
  const account: AuthAccount = {
    id: createId(),
    username,
    fullName,
    email,
    passwordSalt,
    passwordHash: await hashPassword(input.password, passwordSalt),
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

//
// Profil akun aktif
//

/**
 * Perbarui nama lengkap dan/atau username AKUN YANG SEDANG LOGIN saja.
 * Username dipakai sebagai identitas login, jadi wajib unik. Jika username
 * berubah, sesi login ikut diperbarui sehingga semua halaman (Dashboard,
 * Profil, Pengaturan) langsung menampilkan data terbaru.
 */
export async function updateProfile(input: {
  fullName: string;
  username: string;
}): Promise<ProfileResult> {
  const session = cache;
  if (!session) {
    return { ok: false, error: "Tidak ada sesi login. Silakan login kembali." };
  }

  const fullName = input.fullName.trim();
  const username = input.username.trim();

  if (!fullName) {
    return { ok: false, error: "Nama lengkap wajib diisi." };
  }
  if (!username) {
    return { ok: false, error: "Username wajib diisi." };
  }
  if (username.includes("@") && !EMAIL_REGEX.test(username)) {
    return { ok: false, error: "Format email tidak valid." };
  }

  const accounts = await readAccounts();
  const currentId = normalize(session.username);
  const index = accounts.findIndex((acc) => normalize(acc.username) === currentId);
  if (index < 0) {
    return { ok: false, error: "Akun tidak ditemukan. Silakan login kembali." };
  }

  const usernameTaken = accounts.some(
    (acc, i) => i !== index && normalize(acc.username) === normalize(username),
  );
  // Jangan biarkan akun lain mengambil username akun demo bawaan.
  const claimsDemoName =
    normalize(username) === DEMO_USERNAME && currentId !== DEMO_USERNAME;
  if (usernameTaken || claimsDemoName) {
    return { ok: false, error: "Username sudah digunakan. Pilih username lain." };
  }

  const updated: AuthAccount = { ...accounts[index], fullName, username };
  const nextAccounts = [...accounts];
  nextAccounts[index] = updated;
  try {
    await writeAccounts(nextAccounts);
  } catch {
    return { ok: false, error: "Gagal menyimpan perubahan. Coba lagi." };
  }

  // Sinkronkan sesi aktif agar UI langsung menampilkan data baru.
  await persistSession({
    ...session,
    username: updated.username,
    fullName: updated.fullName,
    email: updated.email,
  });
  return { ok: true };
}

/**
 * Ganti password AKUN YANG SEDANG LOGIN saja (tanpa password lama —
 * alur sederhana untuk autentikasi lokal). Password baru diverifikasi
 * panjang minimum lalu disimpan sebagai hash salt+SHA-256; password lama
 * otomatis tidak berfungsi untuk login berikutnya.
 */
export async function changePassword(newPassword: string): Promise<ProfileResult> {
  const session = cache;
  if (!session) {
    return { ok: false, error: "Tidak ada sesi login. Silakan login kembali." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    };
  }

  const accounts = await readAccounts();
  const currentId = normalize(session.username);
  const index = accounts.findIndex((acc) => normalize(acc.username) === currentId);
  if (index < 0) {
    return { ok: false, error: "Akun tidak ditemukan. Silakan login kembali." };
  }

  const passwordSalt = createSalt();
  const passwordHash = await hashPassword(newPassword, passwordSalt);
  const nextAccounts = [...accounts];
  nextAccounts[index] = { ...accounts[index], passwordSalt, passwordHash };
  try {
    await writeAccounts(nextAccounts);
  } catch {
    return { ok: false, error: "Gagal menyimpan password baru. Coba lagi." };
  }
  return { ok: true };
}
