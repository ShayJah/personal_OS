import { requireSession } from "@/lib/auth/dal";
import { listBusinesses } from "@/lib/crm";
import { getBusinessSnapshots } from "@/lib/business-stats";
import { colorForKey } from "@/lib/project-health";
import { BusinessesView } from "./businesses-view";

export default async function BusinessesPage() {
  const session = await requireSession();
  const businesses = await listBusinesses(session.user.id);
  const snapshots = await getBusinessSnapshots(businesses);

  return (
    <BusinessesView
      businesses={snapshots.map((s) => ({ ...s, color: colorForKey(s.id) }))}
    />
  );
}
