import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getEntryForDate, listRecentEntries } from "@/lib/journal";
import { toDateOnly } from "@/lib/date";
import { cn } from "@/lib/utils";
import { JournalEditor } from "./journal-editor";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireSession();
  const { date: dateParam } = await searchParams;

  const selectedDate = dateParam ? toDateOnly(new Date(dateParam)) : toDateOnly();
  const today = toDateOnly();
  const isToday = dateKey(selectedDate) === dateKey(today);

  const [entry, recent] = await Promise.all([
    getEntryForDate(session.user.id, selectedDate),
    listRecentEntries(session.user.id, 14),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <p className="eyebrow">Private</p>
        <h1 className="mt-1 font-serif text-3xl">Journal</h1>
        <p className="mt-1 text-sm text-muted">
          Never shared, never seen by the AI — just for you.
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          {isToday && <span className="ml-2 text-xs text-muted">Today</span>}
        </p>
        <JournalEditor
          dateKey={dateKey(selectedDate)}
          initial={{ body: entry?.body ?? "", mood: entry?.mood ?? undefined }}
        />
      </div>

      {recent.length > 0 && (
        <div className="border-t border-border pt-6">
          <p className="eyebrow mb-3">Recent entries</p>
          <ul className="space-y-1">
            {recent.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/journal?date=${dateKey(e.date)}`}
                  className={cn(
                    "block truncate rounded-lg px-3 py-2 text-sm hover:bg-foreground/5",
                    dateKey(e.date) === dateKey(selectedDate)
                      ? "bg-accent-soft font-medium"
                      : "text-muted"
                  )}
                >
                  <span className="text-foreground">
                    {e.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>{" "}
                  — {e.body.slice(0, 60)}
                  {e.body.length > 60 ? "…" : ""}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
