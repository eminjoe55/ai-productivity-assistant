import React from "react";
import type { Priority, TaskStatus } from "../types";

export function Card({
  children,
  className = "",
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
}) {
  return (
    <div
      className={`border border-line dark:border-line light:border-line-light rounded-lg bg-surface dark:bg-surface light:bg-surface-light p-5 ${className}`}
    >
      {(title || eyebrow) && (
        <div className="mb-4">
          {eyebrow && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan mb-1">{eyebrow}</p>
          )}
          {title && <h3 className="font-display font-semibold text-base">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-signal-amber text-base hover:brightness-110",
    secondary:
      "bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 text-ink dark:text-ink light:text-ink-light border border-line dark:border-line light:border-line-light hover:border-signal-cyan/50",
    ghost: "text-ink-muted hover:text-ink dark:hover:text-ink light:hover:text-ink-light",
    danger: "bg-signal-red/10 text-signal-red border border-signal-red/30 hover:bg-signal-red/20",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`focus-ring rounded-md px-3.5 py-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "text-ink-muted border-line dark:border-line light:border-line-light",
  medium: "text-signal-cyan border-signal-cyan/30",
  high: "text-signal-amber border-signal-amber/30",
  urgent: "text-signal-red border-signal-red/30",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5 ${PRIORITY_COLORS[priority]}`}
    >
      {priority}
    </span>
  );
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const colors: Record<TaskStatus, string> = {
    todo: "bg-ink-muted/10 text-ink-muted",
    in_progress: "bg-signal-cyan/10 text-signal-cyan",
    done: "bg-signal-green/10 text-signal-green",
    archived: "bg-line/20 text-ink-muted",
  };
  return (
    <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${colors[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 border border-dashed border-line dark:border-line light:border-line-light rounded-lg">
      <p className="text-ink-muted dark:text-ink-muted light:text-ink-light-muted text-sm mb-3">{message}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 rounded ${className}`} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`focus-ring w-full bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 border border-line dark:border-line light:border-line-light rounded-md px-3 py-2 text-sm placeholder:text-ink-muted ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`focus-ring w-full bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 border border-line dark:border-line light:border-line-light rounded-md px-3 py-2 text-sm placeholder:text-ink-muted resize-none ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`focus-ring w-full bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 border border-line dark:border-line light:border-line-light rounded-md px-3 py-2 text-sm ${props.className ?? ""}`}
    />
  );
}
