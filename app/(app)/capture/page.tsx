import { requireSession } from "@/lib/auth/dal";
import { listCaptures } from "@/lib/captures";
import { Card } from "@/components/ui/card";
import { CaptureForm } from "./capture-form";
import { CaptureRow } from "./capture-row";

export default async function CapturePage() {
  const session = await requireSession();
  const captures = await listCaptures(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Quick Capture</h1>
        <p className="text-sm text-foreground/60">
          Get it out of your head. Classify it later.
        </p>
      </div>

      <Card>
        <CaptureForm />
      </Card>

      {captures.length === 0 ? (
        <Card className="py-10 text-center text-sm text-foreground/40">
          Nothing captured yet.
        </Card>
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
