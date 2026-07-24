import { useEffect, useRef, useState } from "react";
import type { ActionItem, MeetingSummaryResult, ParsedSummary } from "../types";
import * as api from "../lib/api";
import { Card, Button, Input, Textarea, EmptyState, Skeleton } from "../components/ui";
import { useToast } from "../hooks/useToast";

function parseSummary(raw: MeetingSummaryResult): { summary: ParsedSummary; actions: ActionItem[] } {
  let summary: ParsedSummary = {
    executive_summary: "",
    discussion_points: [],
    decisions_made: [],
    risks: [],
    next_steps: [],
  };
  let actions: ActionItem[] = [];
  try {
    summary = { ...summary, ...JSON.parse(raw.summary) };
  } catch {
    /* leave defaults */
  }
  try {
    actions = JSON.parse(raw.action_items);
  } catch {
    /* leave defaults */
  }
  return { summary, actions };
}

export default function MeetingSummarizer() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingSummaryResult | null>(null);
  const [history, setHistory] = useState<MeetingSummaryResult[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  useEffect(() => {
    api.summaryHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      push("Only .txt and .md files are supported", "error");
      return;
    }
    const text = await file.text();
    setNotes(text);
    if (!title) setTitle(file.name.replace(/\.(txt|md)$/i, ""));
  }

  async function handleSummarize() {
    if (!notes.trim()) {
      push("Paste or upload meeting notes first", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await api.summarizeMeeting(title || "Untitled Meeting", notes);
      setResult(r);
      setHistory((h) => (h ? [r, ...h] : [r]));
      push("Summary generated", "success");
    } catch {
      push("Summarization failed. Check your ANTHROPIC_API_KEY.", "error");
    } finally {
      setLoading(false);
    }
  }

  function exportAs(format: "md" | "txt") {
    if (!result) return;
    const { summary, actions } = parseSummary(result);
    const content = buildExport(result.title, summary, actions, format);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/\s+/g, "_")}.${format === "md" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard() {
    if (!result) return;
    const { summary, actions } = parseSummary(result);
    await navigator.clipboard.writeText(buildExport(result.title, summary, actions, "txt"));
    push("Copied to clipboard", "success");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan">Module 03</p>
        <h2 className="font-display text-2xl font-semibold mt-1">Meeting Summarizer</h2>
      </div>

      <Card title="Input">
        <div className="space-y-3">
          <Input placeholder="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            rows={8}
            placeholder="Paste raw meeting notes here…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <input ref={fileRef} type="file" accept=".txt,.md" onChange={handleFile} className="hidden" />
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Upload .txt / .md
              </Button>
            </div>
            <Button onClick={handleSummarize} disabled={loading}>
              {loading ? "Summarizing…" : "Generate summary"}
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <Skeleton className="h-6 w-1/2 mb-3" />
          <Skeleton className="h-24" />
        </Card>
      )}

      {result && !loading && (
        <SummaryView result={result} onExport={exportAs} onCopy={copyToClipboard} />
      )}

      <Card title="History">
        {!history ? (
          <Skeleton className="h-12" />
        ) : history.length === 0 ? (
          <EmptyState message="No meetings summarized yet." />
        ) : (
          <ul className="divide-y divide-line/50 dark:divide-line/50 light:divide-line-light/50">
            {history.map((h) => (
              <li key={h.id} className="py-2 flex items-center justify-between text-sm">
                <button
                  className="focus-ring text-left hover:text-signal-cyan"
                  onClick={() => setResult(h)}
                >
                  {h.title}
                </button>
                <span className="font-mono text-xs text-ink-muted">
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SummaryView({
  result,
  onExport,
  onCopy,
}: {
  result: MeetingSummaryResult;
  onExport: (format: "md" | "txt") => void;
  onCopy: () => void;
}) {
  const { summary, actions } = parseSummary(result);
  return (
    <Card eyebrow="Result" title={result.title}>
      <div className="space-y-4 text-sm">
        <Section label="Executive summary">
          <p className="text-ink dark:text-ink light:text-ink-light">{summary.executive_summary || "—"}</p>
        </Section>
        <Section label="Discussion points">
          <BulletList items={summary.discussion_points} />
        </Section>
        <Section label="Decisions made">
          <BulletList items={summary.decisions_made} />
        </Section>
        <Section label="Action items">
          {actions.length === 0 ? (
            <p className="text-ink-muted">None identified.</p>
          ) : (
            <div className="space-y-1.5">
              {actions.map((a, i) => (
                <div key={i} className="flex items-center justify-between border-b border-line/40 dark:border-line/40 light:border-line-light/40 py-1.5">
                  <span>{a.item}</span>
                  <span className="font-mono text-xs text-ink-muted">
                    {a.owner || "Unassigned"} {a.deadline ? `· ${a.deadline}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
        <Section label="Risks">
          <BulletList items={summary.risks} />
        </Section>
        <Section label="Next steps">
          <BulletList items={summary.next_steps} />
        </Section>
      </div>
      <div className="flex gap-2 mt-5 pt-4 border-t border-line dark:border-line light:border-line-light">
        <Button variant="secondary" onClick={() => onExport("md")}>
          Export Markdown
        </Button>
        <Button variant="secondary" onClick={() => onExport("txt")}>
          Export Text
        </Button>
        <Button variant="ghost" onClick={onCopy}>
          Copy to clipboard
        </Button>
      </div>
    </Card>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <p className="text-ink-muted">None identified.</p>;
  return (
    <ul className="list-disc list-inside space-y-1 text-ink dark:text-ink light:text-ink-light">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function buildExport(title: string, summary: ParsedSummary, actions: ActionItem[], format: "md" | "txt"): string {
  const h = format === "md" ? "## " : "";
  const bullet = format === "md" ? "- " : "• ";
  const lines: string[] = [];
  lines.push(format === "md" ? `# ${title}` : title.toUpperCase());
  lines.push("");
  lines.push(`${h}Executive Summary`);
  lines.push(summary.executive_summary || "—");
  lines.push("");
  lines.push(`${h}Discussion Points`);
  summary.discussion_points.forEach((p) => lines.push(bullet + p));
  lines.push("");
  lines.push(`${h}Decisions Made`);
  summary.decisions_made.forEach((p) => lines.push(bullet + p));
  lines.push("");
  lines.push(`${h}Action Items`);
  actions.forEach((a) => lines.push(bullet + `${a.item} (${a.owner || "Unassigned"}${a.deadline ? `, ${a.deadline}` : ""})`));
  lines.push("");
  lines.push(`${h}Risks`);
  summary.risks.forEach((p) => lines.push(bullet + p));
  lines.push("");
  lines.push(`${h}Next Steps`);
  summary.next_steps.forEach((p) => lines.push(bullet + p));
  return lines.join("\n");
}
