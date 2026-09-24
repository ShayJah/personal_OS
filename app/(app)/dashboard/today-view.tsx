import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Priorities } from "./priorities-card";
import { TodayTasks, type TodayTask } from "./today-tasks";
import { HabitCheckin, type HabitItem } from "./habit-checkin";
import { NotificationsCard } from "./notifications-card";

function headline(dueToday: number, overdue: number) {
  if (overdue > 0 && dueToday > 0) return "A full day, and a backlog to clear.";
  if (overdue > 0) return "Nothing due today. Clear the backlog.";
  if (dueToday > 0) return "A focused day. Start with the first thing.";
  return "A clear day. Make it count.";
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export type TodayViewProps = {
  firstName?: string;
  now: Date;
  priorities: string[];
  tasks: TodayTask[];
  dueTodayCount: number;
  overdueCount: number;
  openTaskCount: number;
  habits: HabitItem[];
  notifications: {
    id: string;
    title: string;
    payload: { priorities?: { title: string; why: string }[] } | null;
  }[];
  events: { id: string; title: string; location: string | null; startAt: Date }[];
  followUps: {
    total: number;
    records: {
      id: string;
      nextAction: string | null;
      contact: { name: string };
      business: { id: string; name: string };
    }[];
  };
};

export function TodayView({
  firstName,
  now,
  priorities,
  tasks,
  dueTodayCount,
  overdueCount,
  openTaskCount,
  habits,
  notifications,
  events,
  followUps,
}: TodayViewProps) {
  const habitsDone = habits.filter((h) => h.done).length;
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  const monthDay = now.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const stats = [
    { label: "Due today", value: dueTodayCount, sub: `${openTaskCount} open in total` },
    { label: "Overdue", value: overdueCount, sub: overdueCount > 0 ? "needs attention" : "all caught up", alert: overdueCount > 0 },
    { label: "Habits", value: `${habitsDone}/${habits.length}`, sub: "checked in today" },
    { label: "Follow-ups", value: followUps.total, sub: followUps.total > 0 ? "due in outreach" : "none due", alert: followUps.total > 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl pb-16 md:pb-0">
      <header className="mb-5 flex items-end justify-between gap-3 sm:mb-8">
        <div>
          <p className="eyebrow">Today</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">{weekday}</h1>
        </div>
        <p className="pb-1.5 text-right font-mono text-xs text-muted sm:text-sm">
          {monthDay}
          {firstName && <span className="hidden sm:inline"> · Hi, {firstName}</span>}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <NotificationsCard
            notifications={notifications}
          />

          <Card className="rounded-3xl p-5 sm:p-8">
            <h2 className="font-serif text-3xl leading-[1.1] sm:text-4xl">
              {headline(dueTodayCount, overdueCount)}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
              {plural(dueTodayCount, "task")} due today
              {overdueCount > 0 && `, ${overdueCount} overdue`}
              {events.length > 0 && `, and ${plural(events.length, "event")} on your calendar`}.
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border-strong py-5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-border-strong">
              {stats.map((stat, i) => (
                <div key={stat.label} className={cn(i > 0 && "sm:pl-6")}>
                  <dt className="text-xs text-muted">{stat.label}</dt>
                  <dd
                    className={cn(
                      "mt-1 font-mono text-3xl font-medium tracking-tight sm:text-4xl",
                      stat.alert && "text-danger"
                    )}
                  >
                    {stat.value}
                  </dd>
                  <p className="mt-0.5 text-xs text-muted-soft">{stat.sub}</p>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
              <Priorities initial={priorities} />
              <TodayTasks totalOpen={openTaskCount} tasks={tasks} />
            </div>
          </Card>
        </div>

        <aside className="space-y-4 lg:space-y-5">
          <Card className="rounded-3xl">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Schedule</p>
              <Link href="/calendar" className="text-xs text-muted hover:text-foreground">
                Calendar →
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing scheduled. Your day is open.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="w-16 shrink-0 pt-0.5 font-mono text-xs text-muted">
                      {formatTime(event.startAt)}
                    </span>
                    <span className="min-w-0 flex-1 border-l-2 border-accent/40 pl-3">
                      <span className="block truncate text-[15px]">{event.title}</span>
                      {event.location && (
                        <span className="block truncate text-xs text-muted">{event.location}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="rounded-3xl">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Habits</p>
              <span className="font-mono text-xs text-muted">
                {habitsDone}/{habits.length}
              </span>
            </div>
            <HabitCheckin habits={habits} />
          </Card>

          {followUps.total > 0 && (
            <Card className="rounded-3xl">
              <div className="flex items-baseline justify-between">
                <p className="eyebrow">Outreach follow-ups</p>
                <Link href="/outreach" className="text-xs text-muted hover:text-foreground">
                  Outreach →
                </Link>
              </div>
              <ul className="mt-2">
                {followUps.records.map((record) => (
                  <li key={record.id}>
                    <Link
                      href={`/businesses/${record.business.id}/contacts/${record.id}`}
                      className="flex min-h-11 flex-col justify-center py-1.5"
                    >
                      <span className="truncate text-[15px]">{record.contact.name}</span>
                      <span className="truncate text-xs text-muted">
                        {record.nextAction ?? "Follow up"} · {record.business.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {followUps.total > followUps.records.length && (
                <p className="mt-1 text-xs text-muted-soft">
                  +{followUps.total - followUps.records.length} more
                </p>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
