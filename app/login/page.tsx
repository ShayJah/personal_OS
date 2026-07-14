import { signIn } from "@/lib/auth/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border-strong p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Sign in to PersonalOS</h1>
          <p className="text-sm text-muted">
            Your daily priorities, tasks, and habits in one place.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: from || "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
          >
            Continue with GitHub
          </button>
        </form>
      </div>
    </main>
  );
}
