import { z } from "zod";

/**
 * Study pack = a JSON file the user imports locally in the browser.
 * The public app ships only this schema and a generic demo pack. Real course
 * facts (dates, topics, questions) live in a private pack and never in the repo.
 *
 * Rule enforced here: nothing is "verified" without a source URL and a
 * verified-at date. Blank fields are valid and mean "not supplied yet".
 */

export const PACK_SCHEMA = "study-pack/1" as const;
export const MAX_COURSES = 5;
export const MAX_QUESTIONS = 5000;

const httpUrlOrBlank = z
  .string()
  .max(2000)
  .refine((s) => s === "" || /^https?:\/\/[^\s]+$/i.test(s), "must be blank or an http(s) URL");

const dayOrBlank = z
  .string()
  .refine((s) => s === "" || (/^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s), "must be blank or YYYY-MM-DD");

const timeOrBlank = z.string().refine((s) => s === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(s), "must be blank or HH:MM");

const slug = z.string().min(1).max(80).regex(/^[A-Za-z0-9_.-]+$/, "use letters, digits, - _ .");

export const verificationStatus = z.enum(["unverified", "verified", "changed"]);

const source = z.object({
  label: z.string().min(1).max(200),
  url: httpUrlOrBlank.default(""),
});

export const courseSchema = z.object({
  id: slug,
  code: z.string().max(40).default(""),
  title: z.string().max(200).default(""),
  canvasUrl: httpUrlOrBlank.default(""),
  status: verificationStatus.default("unverified"),
  verifiedAt: dayOrBlank.default(""),
  notes: z.string().max(2000).default(""),
});

export const topicSchema = z.object({
  id: slug,
  courseId: slug,
  title: z.string().min(1).max(200),
  /** true = copied from an official outline; false = the student's own grouping. */
  official: z.boolean().default(false),
  sourceUrl: httpUrlOrBlank.default(""),
});

export const examSchema = z
  .object({
    id: slug,
    courseId: slug,
    title: z.string().max(200).default(""),
    status: verificationStatus.default("unverified"),
    sourceUrl: httpUrlOrBlank.default(""),
    verifiedAt: dayOrBlank.default(""),
    date: dayOrBlank.default(""),
    time: timeOrBlank.default(""),
    timezone: z.string().max(64).default(""),
    durationMin: z.number().int().min(1).max(600).optional(),
    notes: z.string().max(2000).optional(),
    /** topic ids the exam covers; blank until the official coverage is known. */
    coverage: z.array(slug).max(200).default([]),
  })
  .superRefine((e, ctx) => {
    if (e.status === "verified") {
      const need: Array<[keyof typeof e, string]> = [
        ["sourceUrl", "source URL"],
        ["verifiedAt", "verified-at date"],
        ["date", "date"],
        ["timezone", "timezone"],
      ];
      for (const [k, label] of need) {
        if (!e[k]) ctx.addIssue({ code: "custom", path: [k], message: `verified exams need a ${label}` });
      }
    }
    if (e.timezone) {
      try {
        new Intl.DateTimeFormat("en", { timeZone: e.timezone });
      } catch {
        ctx.addIssue({ code: "custom", path: ["timezone"], message: "unknown IANA timezone" });
      }
    }
  });

const base = {
  id: slug,
  courseId: slug,
  topicId: slug,
  /** official = taken from instructor-provided material; generated = practice written by the pack author or a generator. */
  origin: z.enum(["official", "generated"]),
  source,
  explanation: z.string().max(4000).default(""),
  marks: z.number().min(0.25).max(100).default(1),
  prompt: z.string().min(1).max(4000),
};

const mcQ = z.object({ ...base, type: z.literal("mc"), options: z.array(z.string().min(1)).min(2).max(10), answer: z.number().int().min(0) });
const multiQ = z.object({ ...base, type: z.literal("multi"), options: z.array(z.string().min(1)).min(2).max(10), answers: z.array(z.number().int().min(0)).min(1) });
const numQ = z.object({ ...base, type: z.literal("num"), answer: z.number().finite(), unit: z.string().max(20).default(""), tol: z.number().min(0).max(1).optional() });
const matchQ = z.object({ ...base, type: z.literal("match"), pairs: z.array(z.tuple([z.string().min(1), z.string().min(1)])).min(2).max(12) });
const orderQ = z.object({ ...base, type: z.literal("order"), steps: z.array(z.string().min(1)).min(2).max(12) });
const seqQ = z.object({ ...base, type: z.literal("seq"), answer: z.string().min(1).max(500) });
const writtenQ = z.object({ ...base, type: z.literal("written"), reference: z.string().min(1).max(4000), rubric: z.array(z.string().max(300)).max(10).default([]) });
const genQ = z.object({
  ...base,
  prompt: z.string().max(4000).default(""),
  type: z.literal("generated"),
  generator: z.enum(["stack-trace", "queue-trace", "linear-motion"]),
});

export const questionSchema = z
  .discriminatedUnion("type", [mcQ, multiQ, numQ, matchQ, orderQ, seqQ, writtenQ, genQ])
  .superRefine((q, ctx) => {
    if (q.origin === "official" && !q.source.url) {
      ctx.addIssue({ code: "custom", path: ["source", "url"], message: "official questions need a source URL" });
    }
    if (q.type === "generated" && q.origin === "official") {
      ctx.addIssue({ code: "custom", path: ["origin"], message: "generator output is practice, never official" });
    }
    if (q.type === "mc" && q.answer >= q.options.length) {
      ctx.addIssue({ code: "custom", path: ["answer"], message: "answer index out of range" });
    }
    if (q.type === "multi") {
      if (q.answers.some((a) => a >= q.options.length)) ctx.addIssue({ code: "custom", path: ["answers"], message: "answer index out of range" });
      if (new Set(q.answers).size !== q.answers.length) ctx.addIssue({ code: "custom", path: ["answers"], message: "duplicate answer index" });
    }
  });

export const packSchema = z
  .object({
    schema: z.literal(PACK_SCHEMA),
    packId: slug,
    title: z.string().max(200).default(""),
    trainingPlan: z.string().max(60000).optional(),
    courses: z.array(courseSchema).max(MAX_COURSES),
    topics: z.array(topicSchema).max(500).default([]),
    exams: z.array(examSchema).max(100).default([]),
    questions: z.array(questionSchema).max(MAX_QUESTIONS).default([]),
  })
  .superRefine((p, ctx) => {
    const dup = (ids: string[], path: string) => {
      const seen = new Set<string>();
      ids.forEach((id, i) => {
        if (seen.has(id)) ctx.addIssue({ code: "custom", path: [path, i, "id"], message: `duplicate id "${id}"` });
        seen.add(id);
      });
    };
    dup(p.courses.map((c) => c.id), "courses");
    dup(p.topics.map((t) => t.id), "topics");
    dup(p.exams.map((e) => e.id), "exams");
    dup(p.questions.map((q) => q.id), "questions");
    const courses = new Set(p.courses.map((c) => c.id));
    const topics = new Map(p.topics.map((t) => [t.id, t.courseId]));
    p.topics.forEach((t, i) => courses.has(t.courseId) || ctx.addIssue({ code: "custom", path: ["topics", i, "courseId"], message: "unknown course" }));
    p.exams.forEach((e, i) => {
      if (!courses.has(e.courseId)) ctx.addIssue({ code: "custom", path: ["exams", i, "courseId"], message: "unknown course" });
      e.coverage.forEach((t, j) => { if (!topics.has(t) || topics.get(t) !== e.courseId) ctx.addIssue({ code: "custom", path: ["exams", i, "coverage", j], message: `unknown topic or cross-course topic "${t}"` }); });
    });
    p.questions.forEach((q, i) => {
      if (!courses.has(q.courseId)) ctx.addIssue({ code: "custom", path: ["questions", i, "courseId"], message: "unknown course" });
      if (topics.has(q.topicId) && topics.get(q.topicId) !== q.courseId) ctx.addIssue({ code: "custom", path: ["questions", i, "topicId"], message: "topic belongs to another course" });
      if (!topics.has(q.topicId)) ctx.addIssue({ code: "custom", path: ["questions", i, "topicId"], message: "unknown topic" });
    });
  });

export type Course = z.infer<typeof courseSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Exam = z.infer<typeof examSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Pack = z.infer<typeof packSchema>;

export type PackResult = { ok: true; pack: Pack } | { ok: false; errors: string[] };

export function validatePack(raw: unknown): PackResult {
  const r = packSchema.safeParse(raw);
  if (r.success) return { ok: true, pack: r.data };
  const errors = r.error.issues.slice(0, 20).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
  if (r.error.issues.length > 20) errors.push(`…and ${r.error.issues.length - 20} more`);
  return { ok: false, errors };
}

export function parsePackText(text: string): PackResult {
  if (text.length > 5_000_000) return { ok: false, errors: ["file is larger than 5 MB"] };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["not valid JSON"] };
  }
  return validatePack(raw);
}

/** Five blank, unverified course slots. No dates, topics, or questions are invented. */
export function emptyPack(): Pack {
  return {
    schema: PACK_SCHEMA,
    packId: "empty",
    title: "No pack loaded",
    courses: Array.from({ length: MAX_COURSES }, (_, i) => ({
      id: `slot-${i + 1}`,
      code: "",
      title: "",
      canvasUrl: "",
      status: "unverified" as const,
      verifiedAt: "",
      notes: "",
    })),
    topics: [],
    exams: [],
    questions: [],
  };
}
