import type { Pack } from "./pack";

/**
 * Generic demo pack. It is not course material, has no real dates, and exists
 * only so the workspace can be tried before a private pack is imported.
 * Every item is origin "generated" (practice), never "official".
 */
const src = { label: "Demo item written for this app (not course material)", url: "" };

export const DEMO_PACK: Pack = {
  schema: "study-pack/1",
  packId: "demo",
  title: "Demo pack (generic)",
  courses: [
    { id: "demo-1", code: "DEMO", title: "Demo course", canvasUrl: "", status: "unverified", verifiedAt: "", notes: "" },
    ...[2, 3, 4, 5].map((i) => ({ id: `slot-${i}`, code: "", title: "", canvasUrl: "", status: "unverified" as const, verifiedAt: "", notes: "" })),
  ],
  topics: [
    { id: "t-bigo", courseId: "demo-1", title: "Big-O basics", official: false, sourceUrl: "" },
    { id: "t-stack", courseId: "demo-1", title: "Stacks and queues", official: false, sourceUrl: "" },
    { id: "t-motion", courseId: "demo-1", title: "Uniform acceleration", official: false, sourceUrl: "" },
  ],
  exams: [
    { id: "demo-exam", courseId: "demo-1", title: "Demo exam (no real date)", status: "unverified", sourceUrl: "", verifiedAt: "", date: "", time: "", timezone: "", coverage: ["t-bigo", "t-stack", "t-motion"] },
  ],
  questions: [
    { id: "q-bigo-1", type: "mc", courseId: "demo-1", topicId: "t-bigo", origin: "generated", source: src, marks: 1, prompt: "Worst-case time of binary search on a sorted array of n items?", options: ["O(log n)", "O(n)", "O(n log n)", "O(1)"], answer: 0, explanation: "Each step halves the remaining range." },
    { id: "q-bigo-2", type: "match", courseId: "demo-1", topicId: "t-bigo", origin: "generated", source: src, marks: 2, prompt: "Match each operation to its worst-case time.", pairs: [["Array index lookup", "O(1)"], ["Linked-list search", "O(n)"], ["Merge sort", "O(n log n)"], ["Bubble sort", "O(n²)"]], explanation: "Direct index, one walk, log n levels of n work, all pairs." },
    { id: "q-stack-1", type: "multi", courseId: "demo-1", topicId: "t-stack", origin: "generated", source: src, marks: 1, prompt: "Which are LIFO?", options: ["Stack", "Queue", "Call stack", "Printer queue"], answers: [0, 2], explanation: "Stacks and the call stack are last-in first-out." },
    { id: "q-stack-2", type: "order", courseId: "demo-1", topicId: "t-stack", origin: "generated", source: src, marks: 2, prompt: "Order the steps of popping from an array-backed stack.", steps: ["Check the stack is not empty", "Read the top item", "Decrease the top index", "Return the item"], explanation: "Guard first, then read, then shrink, then return." },
    { id: "q-stack-g", type: "generated", generator: "stack-trace", courseId: "demo-1", topicId: "t-stack", origin: "generated", source: src, marks: 1, prompt: "", explanation: "" },
    { id: "q-queue-g", type: "generated", generator: "queue-trace", courseId: "demo-1", topicId: "t-stack", origin: "generated", source: src, marks: 1, prompt: "", explanation: "" },
    { id: "q-motion-1", type: "num", courseId: "demo-1", topicId: "t-motion", origin: "generated", source: src, marks: 1, prompt: "A car speeds up from rest at 2.0 m/s² for 5.0 s. Distance in m?", answer: 25, unit: "m", explanation: "d = ½at² = ½(2)(25) = 25 m." },
    { id: "q-motion-g", type: "generated", generator: "linear-motion", courseId: "demo-1", topicId: "t-motion", origin: "generated", source: src, marks: 1, prompt: "", explanation: "" },
    { id: "q-write-1", type: "written", courseId: "demo-1", topicId: "t-bigo", origin: "generated", source: src, marks: 2, prompt: "In your own words: why can constants be dropped in Big-O?", reference: "Big-O describes growth as n gets large; constant factors do not change the growth class.", rubric: ["Mentions growth as n grows", "Constants do not change the class"], explanation: "" },
  ],
};
