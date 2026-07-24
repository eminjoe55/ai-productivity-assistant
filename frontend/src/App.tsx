import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./hooks/useToast";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import MeetingSummarizer from "./pages/MeetingSummarizer";
import Planner from "./pages/Planner";
import Chat from "./pages/Chat";

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 max-w-6xl">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/meetings" element={<MeetingSummarizer />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
