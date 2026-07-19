import { requireOnboardedSession } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QuickCaptureFab } from "@/components/layout/quick-capture-fab";
import { CommandPalette } from "@/components/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await requireOnboardedSession();
  const userLabel = session.user.name ?? session.user.email ?? "Account";

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNav userLabel={userLabel} signOutAction={signOutAction} />
      <main
        className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 md:px-10 md:py-12"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
      <BottomNav userLabel={userLabel} signOutAction={signOutAction} />
      <QuickCaptureFab />
      <CommandPalette />
    </div>
  );
}
