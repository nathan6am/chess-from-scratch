export {};
import { DateTime } from "luxon";
import { Clock, Game } from "../types/lobby";
import * as Chess from "../../lib/chess";
export function timeElapsedMs(startTimeISO: string, endTimeISO?: string): number {
  const startTime = DateTime.fromISO(startTimeISO);
  if (endTimeISO) {
    const endTime = DateTime.fromISO(endTimeISO);
    return Math.abs(startTime.diff(endTime).toMillis());
  }
  return Math.abs(startTime.diffNow().toMillis());
}

export function currentTimeRemaining(lastMoveTimeISO: string, timeRemainingMs: number): number {
  const lastMoveTime = DateTime.fromISO(lastMoveTimeISO);
  const elapedFromLastMove = Math.abs(lastMoveTime.diffNow().toMillis());
  return timeRemainingMs - elapedFromLastMove;
}

export function currentISO(): string {
  return DateTime.now().toISO();
}

export function switchClock(clock: Clock, moveRecievedISO: string, moveColor: Chess.Color, lagCompMs?: number): Clock {
  if (!clock.lastMoveTimeISO) {
    return {
      ...clock,
      lastMoveTimeISO: DateTime.now().toISO(),
    };
  }
  const initialRemaining = clock.timeRemainingMs[moveColor];
  const elapsed = timeElapsedMs(clock.lastMoveTimeISO, moveRecievedISO);
  const timeRemaining = initialRemaining - elapsed + clock.incrementMs + (lagCompMs || 100);
  clock.timeRemainingMs[moveColor] = timeRemaining;
  return {
    ...clock,
    lastMoveTimeISO: DateTime.now().toISO(),
  };
}
