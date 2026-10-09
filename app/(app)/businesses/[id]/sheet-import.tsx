"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSheetLinkAction, syncSheetAction, createTemplateSheetAction } from "./actions";
import type { SheetSyncResult } from "@/lib/sheet-sync";

const STALE_AFTER_MS = 10 * 60_000;

export function SheetImport({
  businessId,
  crmSheetId,
  crmSheetTab,
  lastSyncedAt,
  isOwner,
}: {
  businessId: string;
  crmSheetId: string | null;
  crmSheetTab: string;
  lastSyncedAt: string | null;
  isOwner: boolean;
}) {
  const [isSavingLink, startSavingLink] = useTransition();
  const [isWorking, startWorking] = useTransition();
  const [result, setResult] = useState<SheetSyncResult | { error: string } | null>(null);
  const autoSynced = useRef(false);

  function run(action: (id: string) => Promise<SheetSyncResult | { error: string }>) {
    setResult(null);
    startWorking(async () => setResult(await action(businessId)));
  }

  // Auto-sync on open when the Sheet hasn't been synced recently, so edits by agents/teammates show up.
  useEffect(() => {
    if (autoSynced.current || !crmSheetId) return;
    autoSynced.current = true;
    if (!lastSyncedAt || Date.now() - new Date(lastSyncedAt).getTime() > STALE_AFTER_MS) {
      startWorking(async () => setResult(await syncSheetAction(businessId)));
    }
  }, [businessId, crmSheetId, lastSyncedAt]);

  const sheetHref = result && "sheetUrl" in result ? result.sheetUrl : crmSheetId ? `https://docs.google.com/spreadsheets/d/${crmSheetId}` : null;

  return (
    <Card className="space-y-3">
      <div>
        <p className="eyebrow">Google Sheet · two-way sync</p>
        <p className="mt-1 text-sm text-muted">
          One Sheet per business: a <b>CRM</b> tab (a row per lead) and a <b>Business</b> tab (name,
          description, plan). Claude or any agent can edit the Sheet; Sync pulls those changes in and
          pushes yours back. If something changed in both places, the app wins for that lead. To drop a
          lead, set its Stage to <i>lost</i> rather than deleting the row.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => run(syncSheetAction)} disabled={isWorking || !crmSheetId}>
          {isWorking ? "Syncing…" : "Sync now"}
        </Button>
        {isOwner && (
          <Button type="button" variant="outline" onClick={() => run(createTemplateSheetAction)} disabled={isWorking}>
            {crmSheetId ? "Create a fresh template Sheet" : "Create template Sheet"}
          </Button>
        )}
        {sheetHref && (
          <a href={sheetHref} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent underline">
            Open Sheet
          </a>
        )}
        {lastSyncedAt && <span className="text-xs text-muted">Last synced {new Date(lastSyncedAt).toLocaleString()}</span>}
      </div>

      {isOwner && (
        <form
          action={(formData) => startSavingLink(() => updateSheetLinkAction(businessId, formData))}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            name="crmSheetUrl"
            defaultValue={crmSheetId ?? ""}
            placeholder="…or paste an existing Google Sheet URL or ID"
            className="min-w-0 flex-1 rounded-lg border border-border-strong bg-transparent px-3 py-2 text-sm"
          />
          <input
            name="crmSheetTab"
            defaultValue={crmSheetTab}
            placeholder="CRM tab name"
            className="w-full rounded-lg border border-border-strong bg-transparent px-3 py-2 text-sm sm:w-32"
          />
          <Button type="submit" variant="outline" disabled={isSavingLink}>
            {isSavingLink ? "Saving…" : "Link Sheet"}
          </Button>
        </form>
      )}

      {result && "error" in result && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result.error}</p>
      )}
      {result && "created" in result && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          {result.rowsSeen} rows read — {result.created} new, {result.updated} updated
          {result.skipped ? `, ${result.skipped} skipped` : ""}; {result.pushed} leads written to the Sheet.
        </p>
      )}
    </Card>
  );
}
