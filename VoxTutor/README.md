# VoxTutor — Frontend

Voice-guided viva & interview practice UI: a Home screen and a Placements
interview screen (question → spoken/typed answer → scored feedback → next
question), built with TanStack Start, React and Tailwind.

This is the **frontend only**. Question sourcing and grading currently run on
placeholder logic ([src/lib/sample-questions.ts](src/lib/sample-questions.ts),
[src/lib/grade-stub.ts](src/lib/grade-stub.ts)) so the UI is fully demoable on
its own — swap those two files for real API calls to wire up a backend.

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:8080`.

## Voice feedback (optional)

Spoken questions/feedback use [Rime](https://rime.ai) if configured; without
it, everything still works, just as text only.

```bash
export RIME_API_KEY=...
```

## Where things live

| | |
|---|---|
| `src/routes/index.tsx` | Home screen |
| `src/routes/placements.tsx` | Interview screen |
| `src/lib/sample-questions.ts` | Placeholder question bank — **replace with a real question source** |
| `src/lib/grade-stub.ts` | Placeholder grading — **replace with real grading** |
| `src/lib/tts.server.ts` / `tts.functions.ts` | Rime voice, independent of the above |
| `src/components/` | UI components (shadcn/ui + `bottom-nav.tsx`) |
