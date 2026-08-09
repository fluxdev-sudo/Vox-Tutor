import "./load-env.server";
import { embedText } from "./embeddings.server";

// Must match COLLECTION in scripts/upload_questions.py.
const COLLECTION = "voxtutor_answers";

// qdrant-client's fastembed integration names the vector after the model
// (fast-<model-name>, lowercased/slugified) rather than leaving it unnamed.
// If scripts/upload_questions.py's MODEL changes, this must change to match —
// check via GET /collections/voxtutor_answers and look at config.params.vectors.
const VECTOR_NAME = "fast-all-minilm-l6-v2";

export type Question = { id: number; question: string };
type ReferenceType = "ideal" | "acceptable" | "misconception";

function qdrantBase(): string {
  const url = process.env["QDRANT_URL"];
  if (!url) throw new Error("QDRANT_URL not configured");
  return url.replace(/\/$/, "");
}

function qdrantHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env["QDRANT_API_KEY"];
  if (key) headers["api-key"] = key;
  return headers;
}

async function qdrantPost(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${qdrantBase()}${path}`, {
    method: "POST",
    headers: qdrantHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Qdrant ${path} failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

/** Every question is stored 3x (ideal/acceptable/misconception) — the "ideal" rows give us one row per question. */
export async function fetchQuestionList(): Promise<Question[]> {
  const data = await qdrantPost(`/collections/${COLLECTION}/points/scroll`, {
    limit: 2000,
    with_payload: true,
    with_vector: false,
    filter: { must: [{ key: "type", match: { value: "ideal" } }] },
  });
  const points = (data.result?.points ?? []) as { payload: { q_id: number; question: string } }[];
  return points
    .map((p) => ({ id: p.payload.q_id, question: p.payload.question }))
    .sort((a, b) => a.id - b.id);
}

/**
 * Grades by relative comparison: embed the student's answer, find whichever of the
 * three stored reference answers (ideal / acceptable / misconception) for this
 * question it's closest to, and score off of *which one* — not a raw similarity
 * cutoff. Raw cosine similarity numbers from general embedding models don't have a
 * reliable absolute "this counts as correct" threshold (unrelated sentences can
 * still score 0.7+), but comparing against an explicit wrong answer as an anchor
 * is a relative judgement, which holds up much better.
 */
export async function gradeAnswer(
  questionId: number,
  answer: string,
): Promise<{ score: number; feedback: string }> {
  const vector = await embedText(answer);

  const searchData = await qdrantPost(`/collections/${COLLECTION}/points/search`, {
    vector: { name: VECTOR_NAME, vector },
    limit: 1,
    with_payload: true,
    filter: { must: [{ key: "q_id", match: { value: questionId } }] },
  });
  const top = (searchData.result?.[0] ?? null) as { payload: { type: ReferenceType; text: string } } | null;
  if (!top) {
    return { score: 0, feedback: "No reference answer found for this question in Qdrant." };
  }

  if (top.payload.type === "ideal") {
    return { score: 92, feedback: "Strong answer — that closely matches what's expected." };
  }

  const idealData = await qdrantPost(`/collections/${COLLECTION}/points/scroll`, {
    limit: 1,
    with_payload: true,
    filter: {
      must: [
        { key: "q_id", match: { value: questionId } },
        { key: "type", match: { value: "ideal" } },
      ],
    },
  });
  const idealText = ((idealData.result?.points?.[0]?.payload as { text?: string } | undefined)?.text) ?? top.payload.text;

  if (top.payload.type === "acceptable") {
    return { score: 65, feedback: `Partly there. A fuller answer: ${idealText}` };
  }

  return { score: 20, feedback: `That's a common mix-up. Here's the correct idea: ${idealText}` };
}
