import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { toDateOnly } from "@/lib/date";

const payloadSchema = z.object({
  userId: z.string().trim().min(1),
  date: z.coerce.date(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
});

const KIND_UNITS: Record<string, string> = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.MFP_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = payloadSchema.parse(await request.json());
  const date = toDateOnly(body.date);
  const { userId } = body;
  const fields = { calories: body.calories, protein: body.protein, carbs: body.carbs, fat: body.fat };

  let written = 0;
  for (const [kind, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    await prisma.metric.upsert({
      where: { userId_kind_date_source: { userId, kind, date, source: "mfp" } },
      update: { value },
      create: { userId, kind, value, unit: KIND_UNITS[kind], date, source: "mfp" },
    });
    written += 1;
  }

  return NextResponse.json({ written });
}
