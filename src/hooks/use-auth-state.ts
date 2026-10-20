import { useEffect, useState } from "react";
import {
  loadSession,
  subscribeSession,
  type AuthSession,
} from "@/data/auth";

/**
 * Hook untuk membaca sesi login dari sumber data tunggal (auth store).
 * Membaca sekali saat mount, lalu tetap sinkron dengan perubahan
 * login/logout dari halaman lain melalui subscribeSession.
 *
 * ready = false berarti sesi belum selesai dibaca — navigasi sebaiknya
 * menunggu (tampil splash) agar tidak sempat menampilkan halaman login
 * ke pengguna yang sebenarnya sudah login.
 */
export function useAuthState(): {
  session: AuthSession | null;
  ready: boolean;
} {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeSession((next) => {
      if (isMounted) {
        setSession(next);
      }
    });
    void loadSession().then((loaded) => {
      if (isMounted) {
        setSession(loaded);
        setReady(true);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { session, ready };
}
