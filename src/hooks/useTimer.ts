import { useState, useRef, useCallback } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

interface UseTimerReturn {
  remaining: number;
  status: TimerStatus;
  progress: number;
  start: (durationMinutes: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer(): UseTimerReturn {
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const totalRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pausedRemainingRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const newRemaining = Math.max(0, pausedRemainingRef.current - elapsed);
    setRemaining(newRemaining);

    if (newRemaining <= 0) {
      clearTimer();
      setStatus('completed');
    }
  }, [clearTimer]);

  const start = useCallback(
    (durationMinutes: number) => {
      clearTimer();
      const totalSeconds = durationMinutes * 60;
      totalRef.current = totalSeconds;
      pausedRemainingRef.current = totalSeconds;
      startTimeRef.current = Date.now();
      setRemaining(totalSeconds);
      setStatus('running');
      intervalRef.current = setInterval(tick, 250);
    },
    [clearTimer, tick],
  );

  const pause = useCallback(() => {
    if (status !== 'running') return;
    clearTimer();
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    pausedRemainingRef.current = Math.max(
      0,
      pausedRemainingRef.current - elapsed,
    );
    setRemaining(pausedRemainingRef.current);
    setStatus('paused');
  }, [status, clearTimer]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    startTimeRef.current = Date.now();
    setStatus('running');
    intervalRef.current = setInterval(tick, 250);
  }, [status, tick]);

  const stop = useCallback(() => {
    clearTimer();
    setRemaining(0);
    setStatus('idle');
    totalRef.current = 0;
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setRemaining(totalRef.current);
    pausedRemainingRef.current = totalRef.current;
    setStatus('idle');
  }, [clearTimer]);

  const progress =
    totalRef.current > 0 ? remaining / totalRef.current : 0;

  return { remaining, status, progress, start, pause, resume, stop, reset };
}
