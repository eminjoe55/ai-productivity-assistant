import { useEffect, useState } from "react";
import type { Task } from "../types";
import { Button, Input, Textarea, Select } from "./ui";
import * as api from "../lib/api";
import { useToast } from "../hooks/useToast";

export default function TaskFormModal({
  task,
  onClose,
  onSaved,
}: {
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [category, setCategory] = useState(task?.category ?? "general");
  const [deadline, setDeadline] = useState(task?.deadline ? task.deadline.slice(0, 10) : "");
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [saving, setSaving] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      push("Title is required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        priority,
        category,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status,
      };
      if (task) {
        await api.updateTask(task.id, payload as Partial<Task>);
        push("Task updated", "success");
      } else {
        await api.createTask(payload as Partial<Task>);
        push("Task created", "success");
      }
      onSaved();
      onClose();
    } catch {
      push("Could not save task", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg border border-line dark:border-line light:border-line-light rounded-lg bg-surface dark:bg-surface light:bg-surface-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">{task ? "Edit task" : "New task"}</h3>
          <button onClick={onClose} className="focus-ring text-ink-muted hover:text-ink dark:hover:text-ink light:hover:text-ink-light">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to get done?" autoFocus />
          </div>
          <div>
            <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Description</label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details, context, links…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Priority</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Status</label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as Task["status"])}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. work" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink-muted uppercase tracking-wider">Deadline</label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
