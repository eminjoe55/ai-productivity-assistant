import React from "react";

interface State {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen p-8 text-center">
          <div>
            <p className="font-mono text-signal-red text-sm mb-2">Something went wrong.</p>
            <p className="text-ink-muted text-sm">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
