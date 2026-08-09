import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoxTutor — Voice-Guided Viva & Interview Drill" },
      {
        name: "description",
        content:
          "Practice viva and interview questions out loud, get instant spoken feedback with VoxTutor.",
      },
      { property: "og:title", content: "VoxTutor — Voice-Guided Viva & Interview Drill" },
      {
        property: "og:description",
        content: "Practice viva and interview questions out loud with VoxTutor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

// Placeholder until real auth/profile data exists.
const USER = { name: "XYZ", location: "Noida, UP" };

const OTHER_MODES = ["Aptitude", "Civils", "Higher Ed", "School Viva Voce"];

function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col font-mono">
      <div className="flex flex-1 flex-col gap-8 px-4 py-6">
        <header className="term-panel flex items-center gap-3 p-4">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-foreground">
              {USER.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-bold tracking-tight term-glow">{USER.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {USER.location}
            </p>
          </div>
        </header>

        <section className="flex flex-col items-center gap-4 py-2 text-center">
          <p className="text-sm text-muted-foreground">Hey {USER.name}, do you want to continue?</p>
          <Link
            to="/placements"
            className="term-panel flex w-full max-w-xs items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-primary transition-colors hover:bg-secondary"
          >
            <Briefcase className="h-5 w-5" />
            PLACEMENTS
          </Link>
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-center text-xs text-muted-foreground">or start practicing other options?</p>
          <div className="grid grid-cols-2 gap-2">
            {OTHER_MODES.map((mode) => (
              <button
                key={mode}
                disabled
                title="Coming soon"
                className="term-panel cursor-not-allowed px-3 py-3 text-xs font-medium text-muted-foreground opacity-50"
              >
                {mode}
              </button>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
