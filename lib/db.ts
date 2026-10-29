import { PrismaClient } from "@prisma/client";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

// Tokens and API keys on these models are encrypted on write and decrypted on read, so no caller handles ciphertext.
const SECRET_MODELS = ["GoogleCalendarConnection", "GmailConnection", "HevyConnection"];
const SECRET_FIELDS = ["accessToken", "refreshToken", "apiKey"];

function mapSecrets(value: unknown, fn: (s: string) => string) {
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  for (const field of SECRET_FIELDS) if (typeof record[field] === "string") record[field] = fn(record[field] as string);
}

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["info"] : [],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, args, query }) {
          if (!SECRET_MODELS.includes(model)) return query(args);
          const a = args as { data?: unknown; create?: unknown; update?: unknown };
          for (const input of [a.data, a.create, a.update]) mapSecrets(input, encryptSecret);
          const result = await query(args);
          for (const row of Array.isArray(result) ? result : [result]) mapSecrets(row, decryptSecret);
          return result;
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
