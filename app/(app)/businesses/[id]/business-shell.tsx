import Link from "next/link";
import { cn } from "@/lib/utils";
import { BusinessAvatar } from "../business-avatar";
import { BusinessShareDialog } from "./business-share-dialog";

export const TABS = [
  { value: "overview", label: "Overview" },
  { value: "pipeline", label: "Pipeline" },
  { value: "contacts", label: "Contacts" },
  { value: "drafts", label: "Drafts" },
  { value: "calendar", label: "Calendar" },
  { value: "settings", label: "Settings" },
] as const;

export type TabValue = (typeof TABS)[number]["value"];

export function BusinessShell({
  business,
  tab,
  counts,
  children,
}: {
  business: { id: string; name: string; description: string | null; color: string; icon: string | null; iconImage: string | null };
  tab: TabValue;
  /** Small numbers shown beside a tab label. */
  counts: Partial<Record<TabValue, number>>;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl pb-16 md:pb-0">
      <nav aria-label="Breadcrumb" className="flex items-center gap-3 text-sm">
        <Link
          href="/businesses"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3.5 transition hover:bg-foreground/5"
        >
          <span aria-hidden="true">←</span> Back
        </Link>
        <span className="hidden items-center gap-2 text-muted sm:flex">
          <Link href="/businesses" className="hover:text-foreground">
            Businesses
          </Link>
          <span aria-hidden="true">›</span>
          <span className="max-w-xs truncate text-foreground">{business.name}</span>
        </span>
      </nav>

      <header className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <BusinessAvatar name={business.name} color={business.color} icon={business.icon} image={business.iconImage} className="h-14 w-14 text-3xl sm:h-16 sm:w-16 sm:text-4xl" />
          <div className="min-w-0">
            <h1 className="font-serif text-4xl leading-[1.05] sm:text-5xl">{business.name}</h1>
            {business.description && (
              <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">{business.description}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BusinessShareDialog businessId={business.id} />
          <Link
            href={`/businesses/${business.id}?tab=pipeline&add=1`}
            className="inline-flex min-h-11 items-center rounded-xl bg-foreground px-5 text-sm font-medium text-background shadow-[0_1px_0_rgba(0,0,0,0.05)] transition hover:bg-foreground/85 active:scale-[0.98]"
          >
            <span aria-hidden="true" className="mr-1.5 text-base leading-none">+</span>
            Add contact
          </Link>
        </div>
      </header>

      <nav
        aria-label="Business sections"
        className="mt-6 overflow-x-auto border-b border-border-strong [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max gap-1">
          {TABS.map((t) => {
            const active = tab === t.value;
            return (
              <Link
                key={t.value}
                href={t.value === "overview" ? `/businesses/${business.id}` : `/businesses/${business.id}?tab=${t.value}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm transition",
                  active
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                )}
              >
                {t.label}
                {counts[t.value] !== undefined && (
                  <span className="font-mono text-xs text-muted-soft">{counts[t.value]}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
