import { useEffect, useState, useCallback } from "react";
import type { Task } from "../types";
import * as api from "../lib/api";
import { Card, Button, Input, Select, EmptyState, Skeleton } from "../components/ui";
import TaskCard from "../components/TaskCard";
import TaskFormModal from "../components/TaskFormModal";
import { useToast } from "../hooks/useToast";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [focus, setFocus] = useState<{ title: string | null; reasoning: string } | null>(null);
  const [focusLoading, setFocusLoading] = useState(false);
  const { push } = useToast();

  const load = useCallback(() => {
    const params: Record<string, string> = { sort_by: sortBy };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    api.listTasks(params).then(setTasks).catch(() => push("Could not load tasks", "error"));
  }, [search, statusFilter, priorityFilter, sortBy, push]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSuggestFocus() {
    setFocusLoading(true);
    try {
      const r = await api.aiSuggestFocus();
      setFocus(r);
    } catch {
      push("Focus suggestion failed. Check your ANTHROPIC_API_KEY.", "error");
    } finally {
      setFocusLoading(false);
    }
  }

  function openNew() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan">Module 02</p>
          <h2 className="font-display text-2xl font-semibold mt-1">Task Manager</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSuggestFocus} disabled={focusLoading}>
            {focusLoading ? "Thinking…" : "Suggest today's focus"}
          </Button>
          <Button onClick={openNew}>+ New task</Button>
        </div>
      </div>

      {focus && (
        <Card className="border-signal-amber/40">
          <p className="font-mono text-[10px] uppercase tracking-widest text-signal-amber mb-1">Today's focus</p>
          <p className="font-medium">{focus.title ?? "No open tasks"}</p>
          <p className="text-sm text-ink-muted mt-1">{focus.reasoning}</p>
        </Card>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="archived">Archived</option>
          </Select>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_at">Sort: Newest</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title</option>
          </Select>
        </div>
      </Card>

      {!tasks ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          message="No tasks match your filters yet."
          action={
            <Button variant="secondary" onClick={openNew}>
              Create your first task
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onChanged={load} onEdit={openEdit} />
          ))}
        </div>
      )}

      {modalOpen && (
        <TaskFormModal task={editingTask} onClose={() => setModalOpen(false)} onSaved={load} />
      )}
    </div>
  );
}
