// Pure goal/pace helpers (no server-only) so client components can use them too.
import { GOAL_METRICS, type GoalMetric } from "@/lib/validation/goal";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export const GOAL_METRIC_META: Record<GoalMetric, { label: string; noun: string; verb: string }> = {
  sends: { label: "Messages sent", noun: "sends", verb: "sent" },
  replies: { label: "Replies received", noun: "replies", verb: "replies" },
  meetings: { label: "Meetings booked", noun: "meetings", verb: "booked" },
};

export function isGoalMetric(value: string | null | undefined): value is GoalMetric {
  return GOAL_METRICS.includes(value as GoalMetric);
}

export type GoalPaceStatus = "done" | "ahead" | "on_track" | "at_risk" | "behind" | "not_started";

export const GOAL_STATUS_META: Record<GoalPaceStatus, { label: string; text: string; soft: string; dot: string; bar: string }> = {
  done: { label: "Done", text: "text-foreground", soft: "bg-surface-sunken", dot: "bg-foreground", bar: "bg-foreground" },
  ahead: { label: "Ahead", text: "text-success", soft: "bg-success-soft", dot: "bg-success", bar: "bg-success" },
  on_track: { label: "On track", text: "text-success", soft: "bg-success-soft", dot: "bg-success", bar: "bg-success" },
  at_risk: { label: "At risk", text: "text-warning", soft: "bg-warning-soft", dot: "bg-warning", bar: "bg-warning" },
  behind: { label: "Behind", text: "text-danger", soft: "bg-danger-soft", dot: "bg-danger", bar: "bg-danger" },
  not_started: { label: "Not started", text: "text-muted", soft: "bg-surface-sunken", dot: "bg-muted-soft", bar: "bg-muted-soft" },
};

/** The calendar year / quarter a goal's horizon refers to right now (UTC). */
export function goalPeriod(horizon: string, now: Date = new Date()): { start: Date; end: Date } {
  const y = now.getUTCFullYear();
  if (horizon === "quarter") {
    const q = Math.floor(now.getUTCMonth() / 3);
    return { start: new Date(Date.UTC(y, q * 3, 1)), end: new Date(Date.UTC(y, q * 3 + 3, 1)) };
  }
  return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y + 1, 0, 1)) };
}

export type GoalPace = {
  status: GoalPaceStatus;
  pct: number;
  /** Where a steady pace would put you today. */
  expected: number;
  /** What this week should add up to, and what it has so far. */
  neededThisWeek: number;
  doneThisWeek: number;
};

/**
 * Compares progress with how much of the period has elapsed, and works out what
 * this week has to deliver to stay on a steady pace.
 */
export function computeGoalPace(input: {
  target: number;
  current: number;
  doneThisWeek: number;
  start: Date;
  end: Date;
  now?: Date;
}): GoalPace {
  const { target, current, doneThisWeek, start, end } = input;
  const now = input.now ?? new Date();
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const elapsed = Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
  const expected = target * elapsed;

  const weeksLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / WEEK_MS));
  const beforeThisWeek = Math.max(0, current - doneThisWeek);
  const neededThisWeek = Math.max(0, Math.ceil((target - beforeThisWeek) / weeksLeft));

  let status: GoalPaceStatus;
  if (target > 0 && current >= target) status = "done";
  else if (current === 0 && elapsed * (end.getTime() - start.getTime()) < WEEK_MS) status = "not_started";
  else {
    const ratio = expected > 0 ? current / expected : 1;
    status = ratio >= 1.1 ? "ahead" : ratio >= 0.85 ? "on_track" : ratio >= 0.6 ? "at_risk" : "behind";
  }
  return { status, pct, expected, neededThisWeek, doneThisWeek };
}

