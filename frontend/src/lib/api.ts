import type {
  Task,
  DashboardData,
  MeetingSummaryResult,
  PlannerResponse,
  ChatMessage,
} from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Dashboard ----
export const getDashboard = () => request<DashboardData>("/dashboard");

// ---- Tasks ----
export const listTasks = (params?: Record<string, string>) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return request<Task[]>(`/tasks${qs}`);
};
export const createTask = (data: Partial<Task>) =>
  request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) });
export const updateTask = (id: string, data: Partial<Task>) =>
  request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTask = (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" });
export const completeTask = (id: string) => request<Task>(`/tasks/${id}/complete`, { method: "POST" });
export const archiveTask = (id: string) => request<Task>(`/tasks/${id}/archive`, { method: "POST" });

export const aiSuggestPriority = (id: string) =>
  request<{ priority: string; reasoning: string }>(`/tasks/${id}/ai/suggest-priority`, { method: "POST" });
export const aiEstimateTime = (id: string) =>
  request<{ estimate_minutes: number; reasoning: string }>(`/tasks/${id}/ai/estimate-time`, { method: "POST" });
export const aiSubtasks = (id: string) =>
  request<{ subtasks: string[] }>(`/tasks/${id}/ai/subtasks`, { method: "POST" });
export const aiSuggestDeadline = (id: string) =>
  request<{ suggested_days_from_now: number; reasoning: string }>(`/tasks/${id}/ai/suggest-deadline`, {
    method: "POST",
  });
export const aiSuggestFocus = () =>
  request<{ task_id: string | null; title: string | null; reasoning: string }>("/tasks/ai/suggest-focus");

// ---- Meeting summarizer ----
export const summarizeMeeting = (title: string, notes: string) =>
  request<MeetingSummaryResult>("/summarize", { method: "POST", body: JSON.stringify({ title, notes }) });
export const summaryHistory = () => request<MeetingSummaryResult[]>("/summarize/history");

// ---- Planner ----
export const generatePlan = (payload: {
  date: string;
  working_hours: string;
  priorities: string;
  meetings: string;
}) => request<PlannerResponse>("/planner", { method: "POST", body: JSON.stringify(payload) });
export const plannerHistory = () => request<PlannerResponse[]>("/planner/history");

// ---- Chat (SSE streaming) ----
export async function streamChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal?: AbortSignal
) {
  try {
    const res = await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal,
    });
    if (!res.ok || !res.body) {
      onError(`Request failed: ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6);
        try {
          const payload = JSON.parse(jsonStr);
          if (payload.delta) onDelta(payload.delta);
          if (payload.error) onError(payload.error);
          if (payload.done) onDone();
        } catch {
          // ignore malformed chunk
        }
      }
    }
    onDone();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    onError((err as Error).message);
  }
}
