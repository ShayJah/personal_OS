export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full bg-surface-sunken">
      <div
        className="h-full rounded-full bg-foreground transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
