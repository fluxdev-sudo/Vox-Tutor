import { Link } from "@tanstack/react-router";
import { Bookmark, Home, Settings, Zap } from "lucide-react";

type NavKey = "home" | "bookmarks" | "progress" | "settings";

const ITEMS: { key: NavKey; label: string; icon: typeof Home; href?: "/" }[] = [
  { key: "home", label: "Home", icon: Home, href: "/" },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { key: "progress", label: "Progress", icon: Zap },
  { key: "settings", label: "Settings", icon: Settings },
];

export function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="term-panel mx-auto mb-4 flex w-full max-w-md items-center justify-around rounded-full px-2 py-3">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;
        const content = (
          <div
            className={`flex flex-col items-center gap-1 text-[10px] ${
              isActive ? "text-primary" : item.href ? "text-foreground" : "text-muted-foreground opacity-40"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </div>
        );
        return item.href ? (
          <Link key={item.key} to={item.href} className="flex flex-1 justify-center">
            {content}
          </Link>
        ) : (
          <button key={item.key} disabled className="flex flex-1 cursor-not-allowed justify-center">
            {content}
          </button>
        );
      })}
    </nav>
  );
}
