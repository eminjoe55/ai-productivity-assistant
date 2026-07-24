export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done" | "archived";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  deadline: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  welcome_message: string;
  todays_tasks: { id: string; title: string; priority: Priority }[];
  pending_tasks_count: number;
  completed_tasks_count: number;
  upcoming_deadlines: { id: string; title: string; deadline: string | null }[];
  productivity_score: number;
  recent_meeting_summaries: { id: string; title: string; created_at: string }[];
}

export interface MeetingSummaryResult {
  id: string;
  title: string;
  summary: string; // JSON string: { executive_summary, discussion_points, decisions_made, risks, next_steps }
  action_items: string; // JSON string of [{item, owner, deadline}]
  created_at: string;
}

export interface ParsedSummary {
  executive_summary: string;
  discussion_points: string[];
  decisions_made: string[];
  risks: string[];
  next_steps: string[];
}

export interface ActionItem {
  item: string;
  owner: string;
  deadline: string;
}

export interface TimeBlock {
  start: string;
  end: string;
  label: string;
  type: "deep_work" | "meeting" | "break" | "admin";
  task_id: string | null;
}

export interface PlanResult {
  time_blocks: TimeBlock[];
  suggestions: string[];
}

export interface PlannerResponse {
  id: string;
  date: string;
  working_hours: string;
  generated_plan: string; // JSON string of PlanResult
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
