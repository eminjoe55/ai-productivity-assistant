import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../lib/api";
import type { DashboardData } from "../types";
import { Card, Skeleton, PriorityBadge } from "../components/ui";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Card title="Dashboard unavailable">
        <p className="text-sm text-signal-red">{error}</p>
        <p className="text-xs text-ink-muted mt-2">Is the backend running on port 8000?</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan">Overview</p>
        <h2 className="font-display text-2xl font-semibold mt-1">
          {data?.welcome_message ?? "Loading your workday..."}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatReadout label="Pending" value={data?.pending_tasks_count} loading={!data} />
        <StatReadout label="Completed" value={data?.completed_tasks_count} loading={!data} />
        <StatReadout
          label="Productivity"
          value={data ? `${data.productivity_score}%` : undefined}
          loading={!data}
          accent="green"
        />
        <StatReadout label="Deadlines" value={data?.upcoming_deadlines.length} loading={!data} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card eyebrow="Module 01" title="Today's tasks">
          {!data ? (
            <div className="space-y-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : data.todays_tasks.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing due today. Clean slate.</p>
          ) : (
            <ul className="space-y-2">
              {data.todays_tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-line/50 last:border-0">
                  <span>{t.title}</span>
                  <PriorityBadge priority={t.priority} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/tasks" className="focus-ring inline-block mt-4 text-xs font-mono text-signal-cyan hover:underline">
            Open task manager →
          </Link>
        </Card>

        <Card eyebrow="Module 03" title="Recent meeting summaries">
          {!data ? (
            <Skeleton className="h-16" />
          ) : data.recent_meeting_summaries.length === 0 ? (
            <p className="text-sm text-ink-muted">No meetings summarized yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recent_meeting_summaries.map((m) => (
                <li key={m.id} className="text-sm py-1.5 border-b border-line/50 last:border-0">
                  <p>{m.title}</p>
                  <p className="text-xs text-ink-muted font-mono">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/meetings" className="focus-ring inline-block mt-4 text-xs font-mono text-signal-cyan hover:underline">
            Summarize a meeting →
          </Link>
        </Card>
      </div>

      <Card eyebrow="Upcoming" title="Deadlines on the horizon">
        {!data ? (
          <Skeleton className="h-10" />
        ) : data.upcoming_deadlines.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing scheduled ahead.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data.upcoming_deadlines.map((d) => (
              <div
                key={d.id}
                className="border border-line dark:border-line light:border-line-light rounded-md px-3 py-2 text-sm"
              >
                <p>{d.title}</p>
                <p className="text-xs font-mono text-signal-amber">
                  {d.deadline ? new Date(d.deadline).toLocaleDateString() : "No date"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatReadout({
  label,
  value,
  loading,
  accent = "cyan",
}: {
  label: string;
  value: string | number | undefined;
  loading: boolean;
  accent?: "cyan" | "amber" | "green";
}) {
  const colors = { cyan: "text-signal-cyan", amber: "text-signal-amber", green: "text-signal-green" };
  return (
    <div className="border border-line dark:border-line light:border-line-light rounded-lg p-4 bg-surface dark:bg-surface light:bg-surface-light">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className={`font-display text-3xl font-semibold ${colors[accent]}`}>{value}</p>
      )}
    </div>
  );
}
