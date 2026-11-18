import { signIn } from "@/lib/auth/auth";
import { LogoMark } from "@/components/brand/logo-mark";

// Only same-site paths: "//evil.com" and "https://…" would turn the post-login redirect into an open redirect.
const safePath = (from?: string) => (from && /^\/(?!\/)/.test(from) ? from : "/dashboard");

const ERRORS: Record<string, string> = {
  AccessDenied: "That Google account isn't on the invite list yet. Ask the person who invited you to add your email.",
};

const GoogleG = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  const destination = safePath(from);
  const invited = destination.startsWith("/share/");

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(33,24,16,0.04)] sm:p-8">
          <div className="space-y-3 text-center">
            <LogoMark className="mx-auto size-14" />
            <p className="eyebrow">{invited ? "You're invited" : "Welcome back"}</p>
            <h1 className="font-serif text-3xl leading-tight">{invited ? "One click to join" : "Sign in to Amahoro"}</h1>
            <p className="text-sm text-muted">
              {invited
                ? "Sign in with Google and you'll land right back on the page you were invited to."
                : "Your priorities, projects, and business operations in one place."}
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-5 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {ERRORS[error] ?? "Sign-in didn't work. Please try again."}
            </p>
          )}

          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: destination });
            }}
          >
            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 text-[15px] font-medium text-background transition hover:bg-foreground/85 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <span className="grid size-7 place-content-center rounded-full bg-white">
                <GoogleG />
              </span>
              Continue with Google
            </button>
          </form>

          <ul className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted">
            <li>🔒 No password to create or remember.</li>
            <li>✓ Google shows you exactly what you&apos;re allowing before you continue.</li>
          </ul>
        </div>
        <p className="mt-4 text-center text-xs text-muted-soft">Trouble signing in? Ask whoever invited you.</p>
      </div>
    </main>
  );
}
