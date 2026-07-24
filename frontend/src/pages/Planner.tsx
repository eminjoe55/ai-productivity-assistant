import { useEffect, useState } from "react";
import type { PlanResult, PlannerResponse, TimeBlock } from "../types";
import * as api from "../lib/api";
import { Card, Button, Input, Textarea, Skeleton, EmptyState } from "../components/ui";
import { useToast } from "../hooks/useToast";

const TYPE_COLORS: Record<TimeBlock["type"], string> = {
  deep_work: "bg-signal-amber/15 border-signal-amber/40 text-signal-amber",
  meeting: "bg-signal-cyan/15 border-signal-cyan/40 text-signal-cyan",
  break: "bg-signal-green/15 border-signal-green/40 text-signal-green",
  admin: "bg-ink-muted/10 border-line text-ink-muted",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Planner() {
  const [date, setDate] = useState(todayISO());
  const [workingHours, setWorkingHours] = useState("09:00-17:00");
  const [priorities, setPriorities] = useState("");
  const [meetings, setMeetings] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [history, setHistory] = useState<PlannerResponse[] | null>(null);
  const { push } = useToast();

  useEffect(() => {
    api.plannerHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setPlan(null);
    try {
      const r = await api.generatePlan({ date, working_hours: workingHours, priorities, meetings });
      setPlan(r);
      setHistory((h) => (h ? [r, ...h] : [r]));
      push("Schedule generated", "success");
    } catch {
      push("Planning failed. Check your ANTHROPIC_API_KEY.", "error");
    } finally {
      setLoading(false);
    }
  }

  const parsed: PlanResult | null = plan ? safeParse(plan.generated_plan) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan">Module 04</p>
        <h2 className="font-display text-2xl font-semibold mt-1">Daily Planner</h2>
      </div>

      <Card title="Plan your day">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Working hours</label>
            <Input value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="09:00-17:00" />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Priorities today</label>
          <Textarea
            rows={2}
            value={priorities}
            onChange={(e) => setPriorities(e.target.value)}
            placeholder="e.g. finish the client proposal, prep for demo"
          />
        </div>
        <div className="mt-3">
          <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Meetings</label>
          <Textarea
            rows={2}
            value={meetings}
            onChange={(e) => setMeetings(e.target.value)}
            placeholder="e.g. 11:00 standup, 14:00 client call"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? "Building schedule…" : "Generate schedule"}
          </Button>
        </div>
      </Card>

      {loading && (
        <Card>
          <Skeleton className="h-6 w-1/3 mb-3" />
          <Skeleton className="h-40" />
        </Card>
      )}

      {parsed && !loading && (
        <Card eyebrow={`Schedule · ${plan?.date}`} title="Time-blocked plan">
          <div className="space-y-2">
            {parsed.time_blocks?.map((b, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 rounded-md border px-3 py-2.5 ${TYPE_COLORS[b.type] ?? TYPE_COLORS.admin}`}
              >
                <span className="font-mono text-xs w-28 shrink-0">
                  {b.start}–{b.end}
                </span>
                <span className="text-sm flex-1 text-ink dark:text-ink light:text-ink-light">{b.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">{b.type.replace("_", " ")}</span>
              </div>
            ))}
          </div>
          {parsed.suggestions?.length > 0 && (
            <div className="mt-5 pt-4 border-t border-line dark:border-line light:border-line-light">
              <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan mb-2">
                Productivity suggestions
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-ink dark:text-ink light:text-ink-light">
                {parsed.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <Card title="History">
        {!history ? (
          <Skeleton className="h-12" />
        ) : history.length === 0 ? (
          <EmptyState message="No plans generated yet." />
        ) : (
          <ul className="divide-y divide-line/50 dark:divide-line/50 light:divide-line-light/50">
            {history.map((h) => (
              <li key={h.id} className="py-2 flex items-center justify-between text-sm">
                <button className="focus-ring text-left hover:text-signal-cyan" onClick={() => setPlan(h)}>
                  {h.date}
                </button>
                <span className="font-mono text-xs text-ink-muted">{h.working_hours}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function safeParse(raw: string): PlanResult {
  try {
    const parsed = JSON.parse(raw);
    return { time_blocks: parsed.time_blocks ?? [], suggestions: parsed.suggestions ?? [] };
  } catch {
    return { time_blocks: [], suggestions: [] };
  }
}
