import { requireSession } from "@/lib/auth/dal";
import { listCaptures } from "@/lib/captures";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CaptureForm } from "./capture-form";
import { CaptureRow } from "./capture-row";

export default async function CapturePage() {
  const session = await requireSession();
  const captures = await listCaptures(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Capture</p>
        <h1 className="mt-1 font-serif text-3xl">Quick capture</h1>
        <p className="mt-1 text-sm text-muted">
          Get it out of your head. Classify it later.
        </p>
      </div>

      <Card>
        <CaptureForm />
      </Card>

      {captures.length === 0 ? (
        <EmptyState title="Nothing captured yet" />
      ) : (
        <div className="space-y-2">
          {captures.map((capture) => (
            <CaptureRow key={capture.id} capture={capture} />
          ))}
        </div>
      )}
    </div>
  );
}
