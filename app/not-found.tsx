import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm space-y-3 text-center">
        <h1 className="font-serif text-2xl">Page not found</h1>
        <p className="text-sm text-muted">
          The page you're looking for doesn't exist or was moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block text-sm font-medium text-foreground underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </Card>
    </div>
  );
}
