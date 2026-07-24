import { NavLink } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", code: "01" },
  { to: "/tasks", label: "Tasks", code: "02" },
  { to: "/meetings", label: "Meeting Summarizer", code: "03" },
  { to: "/planner", label: "Daily Planner", code: "04" },
  { to: "/chat", label: "AI Chat", code: "05" },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const now = new Date();

  return (
    <aside className="w-60 shrink-0 border-r border-line dark:border-line light:border-line-light flex flex-col h-screen sticky top-0 bg-surface/60 dark:bg-surface/60 light:bg-surface-light/80 backdrop-blur-sm">
      <div className="px-5 py-5 border-b border-line dark:border-line light:border-line-light">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-signal-green animate-blink" />
          <span className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">
            System Online
          </span>
        </div>
        <h1 className="font-display font-semibold text-lg mt-2 tracking-tight">
          Console
        </h1>
        <p className="text-xs text-ink-muted dark:text-ink-muted light:text-ink-light-muted font-mono">
          AI Productivity Assistant
        </p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors group ${
                isActive
                  ? "bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 text-ink dark:text-ink light:text-ink-light"
                  : "text-ink-muted dark:text-ink-muted light:text-ink-light-muted hover:text-ink dark:hover:text-ink light:hover:text-ink-light hover:bg-surface-2/50 dark:hover:bg-surface-2/50 light:hover:bg-surface-light-2/50"
              }`
            }
          >
            <span className="font-mono text-[10px] text-signal-amber">{item.code}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-line dark:border-line light:border-line-light space-y-3">
        <button
          onClick={toggleTheme}
          className="focus-ring w-full flex items-center justify-between text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink dark:hover:text-ink light:hover:text-ink-light border border-line dark:border-line light:border-line-light rounded-md px-3 py-2 transition-colors"
        >
          <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
          <span className="w-8 h-4 rounded-full bg-line dark:bg-line light:bg-line-light relative">
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-signal-cyan transition-all ${
                theme === "dark" ? "left-0.5" : "left-4"
              }`}
            />
          </span>
        </button>
        <p className="font-mono text-[10px] text-ink-muted">
          {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </div>
    </aside>
  );
}
