"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-sm space-y-3 text-center">
        <h1 className="font-serif text-2xl">Something went wrong</h1>
        <p className="text-sm text-muted">
          An unexpected error occurred. You can try again, or head back to
          the dashboard.
        </p>
        <Button onClick={reset}>Try again</Button>
      </Card>
    </div>
  );
}
