import Link from "next/link";
import { auth } from "@/lib/auth/auth";

export default async function LandingPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="font-serif text-4xl">Amahoro</h1>
        <p className="text-muted">
          A calm, minimal operations system for your priorities, projects,
          calendar, and business/CRM workflows.
        </p>
        <Link
          href={session?.user ? "/dashboard" : "/login"}
          className="inline-flex items-center justify-center rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
        >
          {session?.user ? "Go to dashboard" : "Get started"}
        </Link>
      </div>
    </main>
  );
}
