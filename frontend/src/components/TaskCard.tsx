import { useState } from "react";
import type { Task } from "../types";
import { PriorityBadge, Button } from "./ui";
import * as api from "../lib/api";
import { useToast } from "../hooks/useToast";

export default function TaskCard({
  task,
  onChanged,
  onEdit,
}: {
  task: Task;
  onChanged: () => void;
  onEdit: (task: Task) => void;
}) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const { push } = useToast();

  async function runAi(kind: string) {
    setAiLoading(kind);
    setAiResult(null);
    try {
      if (kind === "priority") {
        const r = await api.aiSuggestPriority(task.id);
        setAiResult(`Suggested: ${r.priority.toUpperCase()} — ${r.reasoning}`);
      } else if (kind === "estimate") {
        const r = await api.aiEstimateTime(task.id);
        setAiResult(`Estimated: ~${r.estimate_minutes} min — ${r.reasoning}`);
      } else if (kind === "subtasks") {
        const r = await api.aiSubtasks(task.id);
        setAiResult(r.subtasks.map((s, i) => `${i + 1}. ${s}`).join("\n"));
      } else if (kind === "deadline") {
        const r = await api.aiSuggestDeadline(task.id);
        setAiResult(`Suggested: ${r.suggested_days_from_now} day(s) from now — ${r.reasoning}`);
      }
    } catch (e) {
      push("AI request failed. Check your ANTHROPIC_API_KEY.", "error");
    } finally {
      setAiLoading(null);
    }
  }

  async function handleComplete() {
    await api.completeTask(task.id);
    push("Task marked complete", "success");
    onChanged();
  }

  async function handleArchive() {
    await api.archiveTask(task.id);
    push("Task archived", "info");
    onChanged();
  }

  async function handleDelete() {
    await api.deleteTask(task.id);
    push("Task deleted", "info");
    onChanged();
  }

  return (
    <div className="border border-line dark:border-line light:border-line-light rounded-lg p-4 bg-surface dark:bg-surface light:bg-surface-light hover:border-signal-cyan/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{task.title}</p>
          {task.description && (
            <p className="text-sm text-ink-muted dark:text-ink-muted light:text-ink-light-muted mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs font-mono text-ink-muted">
        <span>{task.category}</span>
        {task.deadline && <span className="text-signal-amber">{new Date(task.deadline).toLocaleDateString()}</span>}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {task.status !== "done" && (
          <Button variant="secondary" onClick={handleComplete} className="!py-1 !px-2 text-xs">
            Complete
          </Button>
        )}
        <Button variant="ghost" onClick={() => onEdit(task)} className="!py-1 !px-2 text-xs">
          Edit
        </Button>
        <Button variant="ghost" onClick={handleArchive} className="!py-1 !px-2 text-xs">
          Archive
        </Button>
        <Button variant="danger" onClick={handleDelete} className="!py-1 !px-2 text-xs">
          Delete
        </Button>
        <Button variant="ghost" onClick={() => setAiOpen((v) => !v)} className="!py-1 !px-2 text-xs ml-auto text-signal-cyan">
          {aiOpen ? "Hide AI ▲" : "AI Assist ▼"}
        </Button>
      </div>

      {aiOpen && (
        <div className="mt-3 pt-3 border-t border-line/50 dark:border-line/50 light:border-line-light/50 space-y-2">
          <div className="flex flex-wrap gap-2">
            {[
              ["priority", "Suggest priority"],
              ["estimate", "Estimate time"],
              ["subtasks", "Break into subtasks"],
              ["deadline", "Suggest deadline"],
            ].map(([kind, label]) => (
              <button
                key={kind}
                onClick={() => runAi(kind)}
                disabled={aiLoading !== null}
                className="focus-ring text-xs font-mono border border-signal-cyan/30 text-signal-cyan rounded px-2 py-1 hover:bg-signal-cyan/10 disabled:opacity-40"
              >
                {aiLoading === kind ? "Thinking…" : label}
              </button>
            ))}
          </div>
          {aiResult && (
            <pre className="text-xs whitespace-pre-wrap font-mono bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 rounded p-3 text-ink dark:text-ink light:text-ink-light">
              {aiResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
