import { useCallback, useRef, useState } from "react";

//Fast start, slow finish, never
// backwards — this reads as faster than a linear bar even for an operation
// that takes exactly as long.
export function useFakeProgress(capPercent = 90) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = useCallback(() => {
    clear();
    setProgress(20); // instant jump — the first paint already looks like real progress

    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= capPercent) return p;
        const remaining = capPercent - p;
        return p + remaining * 0.12; // decelerating step, asymptotic toward capPercent
      });
    }, 200);
  }, [capPercent]);

  const finish = useCallback(() => {
    clear();
    setProgress(100);
  }, []);

  const reset = useCallback(() => {
    clear();
    setProgress(0);
  }, []);

  return { progress, start, finish, reset };
}
