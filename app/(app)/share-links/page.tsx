import { requireSession } from "@/lib/auth/dal";
import { getUserShareLinks } from "@/lib/sharing";
import { Card } from "@/components/ui/card";
import { ShareLinksManager } from "./share-links-manager";

export default async function ShareLinksPage() {
  const session = await requireSession();
  const links = await getUserShareLinks(session.user.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Shared Links</h1>
        <p className="text-sm text-foreground/60">
          Manage links to your progress pages and reports
        </p>
      </div>

      <Card>
        <ShareLinksManager initialLinks={links} userId={session.user.id} />
      </Card>

      <Card className="bg-foreground/5 p-6">
        <h3 className="font-medium">How sharing works</h3>
        <ul className="mt-3 space-y-2 text-sm text-foreground/70">
          <li>• Each share link can be independently revoked</li>
          <li>• Links can be set to expire after a certain time</li>
          <li>• Your personal data is only visible through links you create</li>
          <li>• Recipients can view your progress without needing an account</li>
        </ul>
      </Card>
    </div>
  );
}
