/**
 * Velocity Calculator
 *
 * Calculates views/hour growth rate and acceleration for videos
 * by comparing historical snapshots.
 */

import { VideoSnapshot } from '../../types';

export interface VelocityData {
  videoId: string;
  currentVelocity: number; // Views/hour over last snapshot period
  acceleration: number; // Change in velocity (positive = accelerating)
  trend: 'accelerating' | 'decelerating' | 'stable';
  peakVelocity: number; // Highest velocity recorded
  avgVelocity: number; // Average velocity across all snapshots
}

/**
 * Calculate velocity between two snapshots
 */
export const calculateVelocityBetweenSnapshots = (
  newer: VideoSnapshot,
  older: VideoSnapshot
): number => {
  const viewsDelta = newer.views - older.views;
  const timeDelta =
    (new Date(newer.snapshot_at).getTime() - new Date(older.snapshot_at).getTime()) / 1000; // seconds
  const hoursDelta = timeDelta / 3600;

  if (hoursDelta === 0) return 0;

  return viewsDelta / hoursDelta; // Views per hour
};

/**
 * Calculate comprehensive velocity data from multiple snapshots
 */
export const calculateVelocityData = (snapshots: VideoSnapshot[]): VelocityData | null => {
  if (snapshots.length < 2) return null;

  // Sort by time (newest first)
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.snapshot_at).getTime() - new Date(a.snapshot_at).getTime()
  );

  const velocities: number[] = [];

  // Calculate velocity between each consecutive pair
  for (let i = 0; i < sorted.length - 1; i++) {
    const velocity = calculateVelocityBetweenSnapshots(sorted[i], sorted[i + 1]);
    velocities.push(velocity);
  }

  if (velocities.length === 0) return null;

  // Current velocity (most recent period)
  const currentVelocity = velocities[0];

  // Average velocity
  const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

  // Peak velocity
  const peakVelocity = Math.max(...velocities);

  // Acceleration (change in velocity)
  const acceleration = velocities.length > 1 ? velocities[0] - velocities[1] : 0;

  // Determine trend
  let trend: 'accelerating' | 'decelerating' | 'stable';
  if (Math.abs(acceleration) < avgVelocity * 0.1) {
    trend = 'stable';
  } else if (acceleration > 0) {
    trend = 'accelerating';
  } else {
    trend = 'decelerating';
  }

  return {
    videoId: sorted[0].video_id,
    currentVelocity,
    acceleration,
    trend,
    peakVelocity,
    avgVelocity,
  };
};

/**
 * Calculate velocity score (normalized to 1-10 scale)
 */
export const calculateVelocityScore = (velocity: number, channelAvgViews: number): number => {
  // Assume channel avg views happens over 1 week = 168 hours
  const avgVelocity = channelAvgViews / 168;

  if (avgVelocity === 0) return 5; // Default mid-range score

  const multiplier = velocity / avgVelocity;

  // Map multiplier to 1-10 scale
  // 0.5x = 1, 1x = 5, 2x = 8, 3x+ = 10
  if (multiplier <= 0.5) return 1;
  if (multiplier <= 1) return Math.round(1 + (multiplier - 0.5) * 8); // 1-5
  if (multiplier <= 2) return Math.round(5 + (multiplier - 1) * 3); // 5-8
  return Math.min(10, Math.round(8 + (multiplier - 2) * 1)); // 8-10
};

/**
 * Estimate time to reach target views
 */
export const estimateTimeToViews = (
  currentViews: number,
  targetViews: number,
  currentVelocity: number
): number => {
  if (currentVelocity <= 0 || currentViews >= targetViews) return 0;

  const viewsNeeded = targetViews - currentViews;
  return viewsNeeded / currentVelocity; // Hours
};

/**
 * Format hours into human-readable string
 */
export const formatTimeEstimate = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Detect if velocity is above channel average (outlier velocity)
 */
export const isOutlierVelocity = (velocity: number, channelAvgViews: number): boolean => {
  const avgVelocity = channelAvgViews / 168; // 1 week in hours
  return velocity >= avgVelocity * 2; // 2x channel average velocity
};

/**
 * Get velocity trend indicator for UI
 */
export const getVelocityTrendIndicator = (
  trend: 'accelerating' | 'decelerating' | 'stable'
): { icon: string; color: string; label: string } => {
  switch (trend) {
    case 'accelerating':
      return { icon: '📈', color: 'text-green-600', label: 'Accelerating' };
    case 'decelerating':
      return { icon: '📉', color: 'text-red-600', label: 'Decelerating' };
    case 'stable':
      return { icon: '➡️', color: 'text-blue-600', label: 'Stable' };
  }
};
