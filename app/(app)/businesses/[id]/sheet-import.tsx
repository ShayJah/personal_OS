"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSheetLinkAction, importFromSheetAction } from "./actions";
import type { SheetImportResult } from "@/lib/crm";

export function SheetImport({
  businessId,
  crmSheetId,
  crmSheetTab,
}: {
  businessId: string;
  crmSheetId: string | null;
  crmSheetTab: string;
}) {
  const [isSavingLink, startSavingLink] = useTransition();
  const [isImporting, startImporting] = useTransition();
  const [result, setResult] = useState<SheetImportResult | { error: string } | null>(null);

  function handleImport() {
    setResult(null);
    startImporting(async () => {
      try {
        const outcome = await importFromSheetAction(businessId);
        setResult(outcome);
      } catch (error) {
        setResult({ error: error instanceof Error ? error.message : "Import failed." });
      }
    });
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="eyebrow">Google Sheet CRM</p>
        <p className="mt-1 text-sm text-muted">
          Pulls leads from your team&apos;s Sheet into this business — the Sheet stays the source of
          truth, this just reads it. Re-run any time to pick up changes.
        </p>
      </div>

      <form
        action={(formData) => startSavingLink(() => updateSheetLinkAction(businessId, formData))}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          name="crmSheetUrl"
          defaultValue={crmSheetId ?? ""}
          placeholder="Paste the Google Sheet URL or ID"
          className="min-w-0 flex-1 rounded-lg border border-border-strong bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="crmSheetTab"
          defaultValue={crmSheetTab}
          placeholder="Tab name"
          className="w-full rounded-lg border border-border-strong bg-transparent px-3 py-2 text-sm sm:w-32"
        />
        <Button type="submit" variant="outline" disabled={isSavingLink}>
          {isSavingLink ? "Saving…" : "Save link"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleImport} disabled={isImporting || !crmSheetId}>
          {isImporting ? "Importing…" : "Import from Sheet"}
        </Button>
        {!crmSheetId && <span className="text-xs text-muted">Save a Sheet link first.</span>}
      </div>

      {result && "error" in result && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{result.error}</p>
      )}
      {result && "created" in result && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          {result.rowsSeen} rows read — {result.created} new, {result.updated} updated
          {result.skipped ? `, ${result.skipped} skipped` : ""}.
        </p>
      )}
    </Card>
  );
}
