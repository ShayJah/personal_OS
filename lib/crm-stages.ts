export const CRM_STAGES = [
  "lead",
  "contacted",
  "qualified",
  "interviewed",
  "proposal",
  "won",
  "lost",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

// "contacted" ("reached out") = success/green per explicit product request;
// the rest fill out a color scale using the app's semantic tokens, one per stage.
export const STAGE_COLOR_CLASSES: Record<string, string> = {
  lead: "bg-muted-soft/40 text-muted border-border-strong",
  contacted: "bg-success-soft text-success border-success/30",
  qualified: "bg-info-soft text-info border-info/30",
  interviewed: "bg-violet-soft text-violet border-violet/30",
  proposal: "bg-warning-soft text-warning border-warning/30",
  won: "bg-accent-soft text-accent border-accent/30",
  lost: "bg-danger-soft text-danger border-danger/30",
};

// Stage changes worth telling the whole team about via Slack.
export const SLACK_NOTIFY_STAGES: readonly string[] = ["interviewed", "won", "lost"];

export function stageColorClasses(stage: string): string {
  return STAGE_COLOR_CLASSES[stage] ?? STAGE_COLOR_CLASSES.lead;
}
