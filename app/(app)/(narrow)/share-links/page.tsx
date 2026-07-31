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
        <p className="eyebrow">Share</p>
        <h1 className="mt-1 font-serif text-3xl">Shared links</h1>
        <p className="mt-1 text-sm text-muted">
          Manage links to your progress pages and reports
        </p>
      </div>

      <Card>
        <ShareLinksManager initialLinks={links} userId={session.user.id} />
      </Card>

      <Card className="bg-surface-sunken p-6">
        <h3 className="font-serif text-lg">How sharing works</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>• Each share link can be independently revoked</li>
          <li>• Links can be set to expire after a certain time</li>
          <li>• Your personal data is only visible through links you create</li>
          <li>• Recipients can view your progress without needing an account</li>
        </ul>
      </Card>
    </div>
  );
}
