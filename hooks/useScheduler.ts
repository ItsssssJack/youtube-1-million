/**
 * useScheduler Hook
 *
 * React hook for managing the automated rotation scheduler.
 * Checks every 5 minutes if it's time to run a scraping session.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getSchedulerState,
  startScheduler,
  forceRunScheduler,
  resetScheduler,
  formatTimeUntilNextRun,
  SchedulerState,
  SchedulerConfig,
  ScrapeResult,
} from '../services/scheduler/rotationScheduler';

export interface UseSchedulerResult {
  state: SchedulerState;
  timeUntilNext: string;
  isRunning: boolean;
  forceRun: () => Promise<ScrapeResult[]>;
  reset: () => void;
  refresh: () => void;
}

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

export const useScheduler = (config: Partial<SchedulerConfig> = {}): UseSchedulerResult => {
  const [state, setState] = useState<SchedulerState>(getSchedulerState());
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  // Update time display every minute
  useEffect(() => {
    const updateTime = () => {
      setTimeUntilNext(formatTimeUntilNextRun());
    };

    updateTime();
    const interval = setInterval(updateTime, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, [state.nextRunAt]);

  // Check periodically if scheduler should run
  useEffect(() => {
    const checkAndRun = async () => {
      try {
        await startScheduler(config);
        setState(getSchedulerState());
      } catch (error) {
        console.error('Scheduler check error:', error);
      }
    };

    // Run immediately on mount
    checkAndRun();

    // Then check periodically
    const interval = setInterval(checkAndRun, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Force run scheduler
  const forceRun = useCallback(async (): Promise<ScrapeResult[]> => {
    try {
      const results = await forceRunScheduler(config);
      setState(getSchedulerState());
      return results;
    } catch (error) {
      console.error('Force run error:', error);
      setState(getSchedulerState());
      throw error;
    }
  }, [config]);

  // Reset scheduler
  const reset = useCallback(() => {
    resetScheduler();
    setState(getSchedulerState());
  }, []);

  // Refresh state from localStorage
  const refresh = useCallback(() => {
    setState(getSchedulerState());
  }, []);

  return {
    state,
    timeUntilNext,
    isRunning: state.isRunning,
    forceRun,
    reset,
    refresh,
  };
};
