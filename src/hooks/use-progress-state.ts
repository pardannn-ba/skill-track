import { useEffect, useState } from "react";
import {
  loadProgress,
  subscribeProgress,
  type ProgressState,
} from "@/data/progress-store";

/**
 * Hook untuk membaca state progres dari sumber data tunggal (memori
 * sesi). Membaca sekali saat mount, lalu tetap sinkron dengan
 * perubahan dari halaman lain melalui subscribeProgress.
 *
 * null = data belum selesai dibaca (halaman bisa tampil skeleton).
 */
export function useProgressState(): ProgressState | null {
  const [state, setState] = useState<ProgressState | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeProgress((next) => {
      if (isMounted) {
        setState(next);
      }
    });
    void loadProgress().then((loaded) => {
      if (isMounted) {
        setState(loaded);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return state;
}
