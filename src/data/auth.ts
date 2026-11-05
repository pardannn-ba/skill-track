
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ========================================
// TIPE
// ========================================

export type AuthSession = {
  username: string;
  fullName: string;
  email?: string;
  loggedInAt: number;
};

export type AuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string };

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

export type ProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export type RegisterInput = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ========================================
// SESSION
// ========================================

let cache: AuthSession | null = null;
let ready = false;

type Listener = (session: AuthSession | null) => void;

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(cache));
}

function mapSession(session: Session | null): AuthSession | null {
  if (!session) return null;

  const metadata = session.user.user_metadata ?? {};
  const email = session.user.email ?? "";

  return {
    username:
      typeof metadata.username === "string"
        ? metadata.username
        : email.split("@")[0],
    fullName:
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.display_name === "string"
          ? metadata.display_name
          : email.split("@")[0],
    email,
    loggedInAt: Date.now(),
  };
}

export function subscribeSession(
  listener: Listener
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

// ========================================
// LOAD SESSION
// ========================================

export async function loadSession(): Promise<AuthSession | null> {
  if (ready) return cache;

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    cache = mapSession(data.session);
  } catch (error) {
    console.error("Load session error:", error);
    cache = null;
  }

  ready = true;
  notify();

  return cache;
}

// Dengarkan perubahan login/logout dari Supabase.
supabase.auth.onAuthStateChange((_event, session) => {
  cache = mapSession(session);
  ready = true;
  notify();
});

// ========================================
// REGISTER
// ========================================

export async function register(
  input: RegisterInput
): Promise<RegisterResult> {
  const fullName = input.fullName.trim();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!fullName) {
    return { ok: false, error: "Nama lengkap wajib diisi." };
  }

  if (!username) {
    return { ok: false, error: "Username wajib diisi." };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      ok: false,
      error: "Username harus 3-20 karakter, hanya huruf, angka, dan underscore.",
    };
  }

  if (!email) {
    return { ok: false, error: "Email wajib diisi." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Format email tidak valid." };
  }

  if (!password) {
    return { ok: false, error: "Password wajib diisi." };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    };
  }

  if (password !== input.confirmPassword) {
    return {
      ok: false,
      error: "Password dan konfirmasi password tidak cocok.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
        },
      },
    });

    if (error) {
      const message = error.message.toLowerCase();

      if (
        error.code === "23505" ||
        message.includes("duplicate") ||
        message.includes("unique") ||
        message.includes("username")
      ) {
        return {
          ok: false,
          error: "Username atau email sudah digunakan.",
        };
      }

      return {
        ok: false,
        error: error.message,
      };
    }

    if (data.user?.identities?.length === 0) {
      return {
        ok: false,
        error: "Email sudah terdaftar. Silakan gunakan email lain.",
      };
    }

    if (!data.user) {
      return {
        ok: false,
        error: "Pendaftaran gagal. Silakan coba lagi.",
      };
    }

    // Dengan konfirmasi email aktif, pengguna perlu
    // memeriksa email sebelum bisa login.

    return { ok: true };
  } catch (error) {
    console.error("Register error:", error);

    return {
      ok: false,
      error: "Terjadi kesalahan saat mendaftar. Coba lagi.",
    };
  }
}

// ========================================
// LOGIN
// ========================================

export async function login(
  identifier: string,
  password: string
): Promise<AuthResult> {
  const email = identifier.trim().toLowerCase();

  if (!email || !password) {
    return {
      ok: false,
      error: "Email dan password wajib diisi.",
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      ok: false,
      error: "Masukkan alamat email yang valid.",
    };
  }

  try {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return {
          ok: false,
          error: "Email belum dikonfirmasi. Periksa inbox email kamu.",
        };
      }

      return {
        ok: false,
        error: "Email atau password salah. Periksa kembali.",
      };
    }

    const session = mapSession(data.session);

    if (!session) {
      return {
        ok: false,
        error: "Login gagal. Silakan coba lagi.",
      };
    }

    cache = session;
    ready = true;
    notify();

    return {
      ok: true,
      session,
    };
  } catch (error) {
    console.error("Login error:", error);

    return {
      ok: false,
      error: "Terjadi kesalahan saat login. Coba lagi.",
    };
  }
}

// ========================================
// LOGOUT
// ========================================

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  cache = null;
  ready = true;
  notify();
}

// ========================================
// UPDATE PROFILE
// ========================================

export async function updateProfile(input: {
  fullName: string;
  username: string;
}): Promise<ProfileResult> {
  const fullName = input.fullName.trim();
  const username = input.username.trim();

  if (!fullName) {
    return { ok: false, error: "Nama lengkap wajib diisi." };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      ok: false,
      error: "Username harus 3-20 karakter, hanya huruf, angka, dan underscore.",
    };
  }

  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      return {
        ok: false,
        error: "Sesi tidak ditemukan. Silakan login kembali.",
      };
    }

    const user = userData.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: fullName,
        username,
      })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (profileError) {
      if (profileError.code === "23505") {
        return {
          ok: false,
          error: "Username sudah digunakan.",
        };
      }

      return {
        ok: false,
        error: profileError.message,
      };
    }

    if (!profile) {
      return {
        ok: false,
        error: "Profil tidak ditemukan atau tidak dapat diperbarui.",
      };
    }

    const { error: metadataError } =
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          username,
        },
      });

    if (metadataError) {
      return {
        ok: false,
        error: metadataError.message,
      };
    }

    const { data: sessionData } =
      await supabase.auth.getSession();

    cache = mapSession(sessionData.session);
    notify();

    return { ok: true };
  } catch (error) {
    console.error("Update profile error:", error);

    return {
      ok: false,
      error: "Gagal memperbarui profil. Silakan coba lagi.",
    };
  }
}

// ========================================
// CHANGE PASSWORD
// ========================================

export async function changePassword(
  newPassword: string
): Promise<ProfileResult> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`,
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("Change password error:", error);

    return {
      ok: false,
      error: "Gagal mengganti password. Silakan coba lagi.",
    };
  }
}
