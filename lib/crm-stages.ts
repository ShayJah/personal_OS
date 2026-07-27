export const CRM_STAGES = ["lead", "contacted", "qualified", "proposal", "won", "lost"] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

// "contacted" ("reached out") = success/green per explicit product request;
// the rest fill out a 6-color status scale using the app's semantic tokens.
export const STAGE_COLOR_CLASSES: Record<string, string> = {
  lead: "bg-muted-soft/40 text-muted border-border-strong",
  contacted: "bg-success-soft text-success border-success/30",
  qualified: "bg-info-soft text-info border-info/30",
  proposal: "bg-warning-soft text-warning border-warning/30",
  won: "bg-accent-soft text-accent border-accent/30",
  lost: "bg-danger-soft text-danger border-danger/30",
};

export function stageColorClasses(stage: string): string {
  return STAGE_COLOR_CLASSES[stage] ?? STAGE_COLOR_CLASSES.lead;
}
