import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/dal";
import { getPins, savePins } from "@/lib/tv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function addPin(formData: FormData) {
  "use server";
  const { user } = await requireSession();
  const text = String(formData.get("text") ?? "").trim().slice(0, 80);
  const date = String(formData.get("date") ?? "");
  if (!text) return;
  const pins = await getPins(user.id);
  pins.push({ id: crypto.randomUUID(), text, ...(/^\d{4}-\d{2}-\d{2}$/.test(date) ? { date } : {}) });
  await savePins(user.id, pins);
  revalidatePath("/home/pins");
}

async function removePin(formData: FormData) {
  "use server";
  const { user } = await requireSession();
  const id = String(formData.get("id"));
  await savePins(user.id, (await getPins(user.id)).filter((p) => p.id !== id));
  revalidatePath("/home/pins");
}

export default async function PinsPage() {
  const session = await requireSession();
  const pins = await getPins(session.user.id);
  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <h1 className="font-serif text-4xl font-extrabold uppercase tracking-wide">Wall pins</h1>
      <p className="text-sm text-muted">Short notes shown on the projector. Add a date to pin one to that day on the wall calendar.</p>
      <Card>
        <form action={addPin} className="flex flex-wrap gap-2">
          <input name="text" required maxLength={80} placeholder="Demo for Maple Salon" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2" />
          <input name="date" type="date" className="rounded-lg border border-border bg-background px-3 py-2" />
          <Button type="submit">Pin</Button>
        </form>
      </Card>
      <ul className="space-y-2">
        {pins.length === 0 && <li className="text-sm text-muted">Nothing pinned.</li>}
        {pins.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <span>
              {p.text}
              {p.date && <span className="ml-2 text-sm text-muted">{p.date}</span>}
            </span>
            <form action={removePin}>
              <input type="hidden" name="id" value={p.id} />
              <Button type="submit" variant="ghost">Remove</Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
