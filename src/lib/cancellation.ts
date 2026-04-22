// Pure helpers for Holiday / Cancellation math.
// No DB access here — callers pass in the data they already loaded.
//
// Per PRD §11.4, the "working-days divisor" is platform-configurable and represents
// how many teaching days map to one 4-week billing period. 26 is the default.
export const WORKING_DAYS_PER_CYCLE = 26;

// Day abbreviations used in Batch.classDaysCsv, e.g. "Mon,Wed,Fri".
const DAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export function parseClassDays(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .map((s) => DAY_INDEX[s])
    .filter((i) => i !== undefined);
}

/**
 * Does the given date fall on a scheduled class day for this batch?
 * Used to decide whether declaring a holiday on that date actually
 * affects any session (PRD §11.5: if the date is already off, flag it).
 */
export function isClassDay(date: Date, classDaysCsv: string | null | undefined): boolean {
  const days = parseClassDays(classDaysCsv);
  return days.includes(date.getUTCDay());
}

/**
 * Refund amount for one enrolled student when ONE session is cancelled under REFUND mode.
 * Formula: pricePer4Weeks * (sessionsAffected / WORKING_DAYS_PER_CYCLE).
 * Rounded down to the nearest rupee.
 */
export function perStudentRefund(pricePer4Weeks: number, sessionsAffected: number) {
  if (pricePer4Weeks <= 0 || sessionsAffected <= 0) return 0;
  return Math.floor((pricePer4Weeks * sessionsAffected) / WORKING_DAYS_PER_CYCLE);
}

/**
 * Add N class-days to a start date, skipping non-class days for the batch.
 * Used when compensation = EXTEND: each missed session pushes the booking's
 * end-of-cycle by one scheduled class day.
 */
export function addClassDays(
  startIso: Date,
  classDaysCsv: string | null | undefined,
  sessions: number,
): Date {
  const days = parseClassDays(classDaysCsv);
  if (days.length === 0 || sessions <= 0) return new Date(startIso);
  const d = new Date(startIso);
  let added = 0;
  while (added < sessions) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (days.includes(d.getUTCDay())) added++;
  }
  return d;
}

export type Compensation = "EXTEND" | "REFUND" | "NONE";
export function isCompensation(s: unknown): s is Compensation {
  return s === "EXTEND" || s === "REFUND" || s === "NONE";
}

export type CancelScope = "WORKSHOP" | "COURSE" | "BATCH";
export function isCancelScope(s: unknown): s is CancelScope {
  return s === "WORKSHOP" || s === "COURSE" || s === "BATCH";
}
