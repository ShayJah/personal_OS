import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

export const addLeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(300).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional(),
});

export const updateStageSchema = z.object({
  stage: z.enum(["lead", "contacted", "qualified", "interviewed", "proposal", "won", "lost"]),
});

export const addActivitySchema = z.object({
  kind: z.enum(["call", "meeting", "note"]),
  body: z.string().trim().min(1).max(5000),
});

export const updateContextDocSchema = z.object({
  contextDoc: z.string().trim().max(20000),
});

export const draftChannelSchema = z.enum(["email", "linkedin"]);

export const assignOwnerSchema = z.object({
  assignedToUserId: z.string().trim().min(1).max(200).nullable(),
});

export const updateSheetLinkSchema = z.object({
  crmSheetUrl: z.string().trim().min(1).max(500),
  crmSheetTab: z.string().trim().min(1).max(100).default("CRM"),
});

export const updateSharedCalendarSchema = z.object({
  sharedCalendarId: z.string().trim().max(300),
});

export const scheduleInterviewSchema = z.object({
  startAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(15).max(240).default(30),
  extraAttendees: z.string().trim().max(1000).optional(),
});

