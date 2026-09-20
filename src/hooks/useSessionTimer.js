import { useCallback, useEffect, useMemo, useState } from 'react';

export function useSessionTimer(isRunning, duration) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = window.setInterval(() => {
      setElapsed((value) => Math.min(value + 1, duration));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [duration, isRunning]);

  const reset = useCallback(() => setElapsed(0), []);
  const remaining = Math.max(duration - elapsed, 0);
  const progress = useMemo(() => (duration ? elapsed / duration : 0), [duration, elapsed]);

  return { elapsed, remaining, progress, reset };
}

export function formatElapsed(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
