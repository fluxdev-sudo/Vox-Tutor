import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const speak = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ text: z.string().min(1).max(1200) }).parse(input))
  .handler(async ({ data }) => {
    const { speakWithRime } = await import("./tts.server");
    try {
      const audio = await speakWithRime(data.text);
      return audio ? { audio } : { audio: null, error: "RIME_API_KEY not configured" };
    } catch (err) {
      return { audio: null, error: err instanceof Error ? err.message : "Voice failed" };
    }
  });
