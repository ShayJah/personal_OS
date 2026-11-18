import "server-only";

/** True only when CRON_SECRET is set and the request carries it — an unset secret must never match. */
export function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Runs `fn` over items a few at a time (not all at once) and tallies the outcome. */
export async function settleInBatches<T>(items: T[], fn: (item: T) => Promise<unknown>, batchSize = 5) {
  let succeeded = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const results = await Promise.allSettled(items.slice(i, i + batchSize).map(fn));
    succeeded += results.filter((r) => r.status === "fulfilled").length;
  }
  return { total: items.length, succeeded, failed: items.length - succeeded };
}
