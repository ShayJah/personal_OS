import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { listEventsForRange, startOfWeek, addDays } from "@/lib/calendar";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { EventRow } from "./event-row";
import { NewEventForm } from "./new-event-form";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireSession();
  const { week } = await searchParams;

  const requestedStart = week ? new Date(week) : new Date();
  const weekStart = startOfWeek(
    Number.isNaN(requestedStart.getTime()) ? new Date() : requestedStart
  );
  const weekEnd = addDays(weekStart, 7);
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = weekEnd;

  const [events, tasks] = await Promise.all([
    listEventsForRange(session.user.id, weekStart, weekEnd),
    prisma.task.findMany({
      where: { userId: session.user.id, completed: false },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const eventsByDay = days.map((day) => {
    const dayEnd = addDays(day, 1);
    return events.filter(
      (e) => new Date(e.startAt) >= day && new Date(e.startAt) < dayEnd
    );
  });

  const rangeLabel = `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Calendar</h1>
          <p className="text-sm text-foreground/60">{rangeLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?week=${prevWeek.toISOString()}`}
            className="rounded-md px-2.5 py-1.5 text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          >
            ← Prev
          </Link>
          <Link
            href="/calendar"
            className="rounded-md px-2.5 py-1.5 text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          >
            Today
          </Link>
          <Link
            href={`/calendar?week=${nextWeek.toISOString()}`}
            className="rounded-md px-2.5 py-1.5 text-sm text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
          >
            Next →
          </Link>
        </div>
      </div>

      <NewEventForm tasks={tasks} defaultStart={weekStart} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day, i) => (
          <Card key={day.toISOString()} className="space-y-2">
            <p className="text-xs font-medium text-foreground/50">
              {DAY_LABELS[i]}{" "}
              {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
            {eventsByDay[i].length === 0 ? (
              <p className="text-xs text-foreground/30">No events</p>
            ) : (
              <div className="space-y-1.5">
                {eventsByDay[i].map((event) => (
                  <EventRow key={event.id} event={event} tasks={tasks} />
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
