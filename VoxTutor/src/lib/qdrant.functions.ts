import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const fetchQuestions = createServerFn({ method: "POST" }).handler(async () => {
  const { fetchQuestionList } = await import("./qdrant.server");
  try {
    const questions = await fetchQuestionList();
    return { questions, error: null as string | null };
  } catch (err) {
    console.error("fetchQuestions failed:", err);
    return { questions: [], error: err instanceof Error ? err.message : "Failed to load questions" };
  }
});

export const gradeAnswer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ questionId: z.number(), answer: z.string().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { gradeAnswer: grade } = await import("./qdrant.server");
    try {
      const result = await grade(data.questionId, data.answer);
      return { ...result, error: null as string | null };
    } catch (err) {
      console.error("gradeAnswer failed:", err);
      return {
        score: 0,
        feedback: "Grading is unavailable right now.",
        error: err instanceof Error ? err.message : "Grading failed",
      };
    }
  });
