// Local sentence embeddings for the web app — no API key needed, runs in Node.
// Must match the model used by the Python uploader script (scripts/upload_questions.py)
// or the vectors won't live in the same space and comparisons will be meaningless.
const MODEL = "Xenova/all-MiniLM-L6-v2";

type FeatureExtractionPipeline = (
  text: string,
  options: { pooling: "mean"; normalize: true },
) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<FeatureExtractionPipeline> | undefined;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  extractorPromise ??= (async () => {
    const { pipeline } = await import("@xenova/transformers");
    return (await pipeline("feature-extraction", MODEL)) as unknown as FeatureExtractionPipeline;
  })();
  return extractorPromise;
}

/** Embeds text into a 384-dim normalized vector, matching scripts/upload_questions.py. */
export async function embedText(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
