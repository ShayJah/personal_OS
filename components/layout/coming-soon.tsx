import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="py-16 text-center">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground/60">
        {description}
      </p>
    </Card>
  );
}
