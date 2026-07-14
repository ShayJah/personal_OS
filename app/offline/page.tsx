export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="font-serif text-2xl">You&apos;re offline</h1>
        <p className="text-sm text-muted">
          PersonalOS couldn&apos;t reach the network. Check your connection
          and try again.
        </p>
      </div>
    </div>
  );
}
