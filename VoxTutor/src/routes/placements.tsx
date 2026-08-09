import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Check, ChevronLeft, Mic, MicOff, Volume2 } from "lucide-react";
import { speak } from "@/lib/tts.functions";
import { fetchQuestions, gradeAnswer } from "@/lib/qdrant.functions";
import type { Question } from "@/lib/qdrant.server";

export const Route = createFileRoute("/placements")({
  head: () => ({
    meta: [
      { title: "Placements — VoxTutor" },
      {
        name: "description",
        content: "Voice-guided placement interview practice with instant spoken feedback.",
      },
    ],
  }),
  component: Placements,
});

type Turn = {
  question: Question;
  answer: string;
  score: number;
  feedback: string;
  bookmarked: boolean;
};

function pickNext(pool: Question[], excludeId?: number): Question | null {
  const options = excludeId ? pool.filter((q) => q.id !== excludeId) : pool;
  const from = options.length ? options : pool;
  if (!from.length) return null;
  return from[Math.floor(Math.random() * from.length)]!;
}

function Placements() {
  const tts = useServerFn(speak);
  const loadQuestions = useServerFn(fetchQuestions);
  const grade = useServerFn(gradeAnswer);

  const [pool, setPool] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [askedCount, setAskedCount] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, current, ended]);

  const say = useCallback(
    async (text: string) => {
      try {
        const res = await tts({ data: { text } });
        if (res.audio) {
          audioRef.current?.pause();
          const el = new Audio(`data:audio/mp3;base64,${res.audio}`);
          el.onplay = () => setSpeaking(true);
          el.onended = () => setSpeaking(false);
          el.onerror = () => setSpeaking(false);
          audioRef.current = el;
          void el.play().catch(() => setSpeaking(false));
          setVoiceNote(null);
        } else if (res.error) {
          setVoiceNote(res.error);
        }
      } catch {
        setVoiceNote("Voice unavailable right now — feedback is shown as text.");
      }
    },
    [tts],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      setBusy(true);
      const res = await loadQuestions();
      if (res.error) {
        setLoadError(res.error);
        setBusy(false);
        return;
      }
      if (!res.questions.length) {
        setLoadError("No questions found in Qdrant yet — upload a question bank first.");
        setBusy(false);
        return;
      }
      setPool(res.questions);
      const first = pickNext(res.questions);
      if (first) {
        setCurrent(first);
        setAskedCount(1);
        await say(`Question 1. ${first.question}`);
      }
      setBusy(false);
    })();
  }, [loadQuestions, say]);

  function toggleListen() {
    if (listening) {
      setListening(false);
      return;
    }
    const w = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceNote("Speech input isn't supported in this browser — type your answer instead.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => setDraft((prev) => `${prev} ${e.results[0][0].transcript}`.trim());
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function confirmAnswer() {
    if (!current || !draft.trim() || busy) return;
    setBusy(true);
    setListening(false);
    const answerText = draft.trim();
    const result = await grade({ data: { questionId: current.id, answer: answerText } });
    if (result.error) setVoiceNote(result.error);
    const turn: Turn = {
      question: current,
      answer: answerText,
      score: result.score,
      feedback: result.feedback,
      bookmarked: false,
    };
    setTurns((prev) => [...prev, turn]);
    setDraft("");
    await say(result.feedback);

    const next = pickNext(pool, current.id);
    setCurrent(next);
    if (next) {
      const count = askedCount + 1;
      setAskedCount(count);
      await say(`Question ${count}. ${next.question}`);
    }
    setBusy(false);
  }

  async function endInterview() {
    setListening(false);
    setCurrent(null);
    setEnded(true);
    if (turns.length) {
      const avg = Math.round(turns.reduce((a, t) => a + t.score, 0) / turns.length);
      await say(
        `Interview ended. You answered ${turns.length} questions with an overall score of ${avg} percent.`,
      );
    }
  }

  function toggleBookmark(i: number) {
    setTurns((prev) => prev.map((t, idx) => (idx === i ? { ...t, bookmarked: !t.bookmarked } : t)));
  }

  const avg = turns.length ? Math.round(turns.reduce((a, t) => a + t.score, 0) / turns.length) : 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-6 font-mono">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight term-glow">PLACEMENTS</h1>
        </div>
        <span className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">
          {askedCount ? `q#${askedCount} · avg ${avg}%` : "starting…"}
        </span>
      </header>

      {loadError && (
        <div className="term-panel flex-1 p-4 text-sm text-destructive">
          <p className="font-semibold">Couldn't start the drill</p>
          <p className="mt-1 text-muted-foreground">{loadError}</p>
        </div>
      )}

      {!loadError && (
        <div
          ref={scrollRef}
          className="term-panel flex-1 space-y-5 overflow-y-auto p-4 text-sm leading-relaxed"
        >
          {turns.map((t, i) => (
            <div key={i} className="space-y-1 border-b border-border/50 pb-4 last:border-0">
              <p>
                <span className="mr-2 text-muted-foreground">Interviewer ▸</span>
                {t.question.question}
              </p>
              <p className="text-accent">
                <span className="mr-2 text-muted-foreground">You ▸</span>
                {t.answer}
              </p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-foreground/90">
                  <span className="mr-2 text-muted-foreground">Interviewer ▸</span>
                  {t.feedback}
                </p>
                <button
                  onClick={() => toggleBookmark(i)}
                  title="Bookmark this question, answer & feedback"
                  className={`shrink-0 rounded p-1 transition-colors ${
                    t.bookmarked ? "text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bookmark className="h-4 w-4" fill={t.bookmarked ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          ))}

          {current && (
            <div className="space-y-1">
              <p>
                <span className="mr-2 text-muted-foreground">Interviewer ▸</span>
                {current.question}
              </p>
              <div className="flex items-start gap-2">
                <span className="pt-1 text-accent">You ▸</span>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Speak or type your answer…"
                  rows={2}
                  disabled={busy}
                  className="flex-1 resize-none bg-transparent text-accent outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {ended && <p className="text-muted-foreground"># interview ended.</p>}
          {busy && (
            <p className="text-muted-foreground">
              …thinking<span className="term-caret">_</span>
            </p>
          )}
        </div>
      )}

      {voiceNote && <p className="text-xs text-destructive">voice: {voiceNote}</p>}

      <footer className="term-panel flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListen}
            disabled={!current || busy}
            title={listening ? "unmuted — tap to stop" : "muted — tap to speak"}
            className={`rounded-full border p-2 transition-colors ${
              listening ? "border-accent text-accent" : "border-border text-foreground hover:bg-secondary"
            } disabled:opacity-40`}
          >
            {listening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
          <button
            onClick={() => void confirmAnswer()}
            disabled={!current || busy || !draft.trim()}
            title="Confirm answer"
            className="rounded-full bg-primary p-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
          </button>
          {speaking && (
            <span className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              speaking…
            </span>
          )}
        </div>
        <button
          onClick={() => void endInterview()}
          disabled={ended || busy}
          className="rounded border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          End Interview
        </button>
      </footer>

      {ended && (
        <Link
          to="/"
          className="text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back to Home
        </Link>
      )}
    </main>
  );
}
