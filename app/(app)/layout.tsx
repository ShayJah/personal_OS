import { requireSession } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/auth";
import { TopNav } from "@/components/layout/top-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav
        userLabel={session.user.name ?? session.user.email ?? "Account"}
        signOutAction={signOutAction}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
