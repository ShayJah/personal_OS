/** UTC-midnight Date for the calendar day `date` falls on — in `timeZone` if given, else UTC. */
export function toDateOnly(date: Date = new Date(), timeZone?: string): Date {
  if (timeZone) {
    // en-CA formats as YYYY-MM-DD
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
    return new Date(`${ymd}T00:00:00.000Z`);
  }
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}
