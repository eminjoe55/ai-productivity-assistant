import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { streamChat } from "../lib/api";
import { Button, Textarea } from "../components/ui";

const SUGGESTED_PROMPTS = [
  "What should I work on today?",
  "Summarize my pending work.",
  "Help me finish everything before Friday.",
  "What are my urgent tasks?",
];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMsg, { role: "assistant" as const, content: "" }];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let acc = "";
    await streamChat(
      [...messages, userMsg],
      (delta) => {
        acc += delta;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      },
      () => setStreaming(false),
      (err) => {
        setStreaming(false);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `⚠ ${err || "Something went wrong. Check your ANTHROPIC_API_KEY."}`,
          };
          return copy;
        });
      },
      controller.signal
    );
  }

  function cancelGeneration() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-signal-cyan">Module 05</p>
        <h2 className="font-display text-2xl font-semibold mt-1">AI Chat Assistant</h2>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto my-4 border border-line dark:border-line light:border-line-light rounded-lg p-4 bg-surface dark:bg-surface light:bg-surface-light space-y-4"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <p className="text-ink-muted text-sm">Ask about your tasks, priorities, or plan for the day.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="focus-ring text-xs font-mono border border-signal-cyan/30 text-signal-cyan rounded-full px-3 py-1.5 hover:bg-signal-cyan/10"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-signal-amber text-base"
                  : "bg-surface-2 dark:bg-surface-2 light:bg-surface-light-2 text-ink dark:text-ink light:text-ink-light"
              }`}
            >
              {m.content || (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-blink" />
                </span>
              )}
              {m.role === "assistant" && i === messages.length - 1 && streaming && (
                <span className="inline-block w-1.5 h-4 bg-signal-cyan ml-0.5 animate-caret align-middle" />
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <Textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask your assistant…"
          className="!resize-none"
        />
        {streaming ? (
          <Button variant="danger" onClick={cancelGeneration}>
            Stop
          </Button>
        ) : (
          <Button type="submit">Send</Button>
        )}
      </form>
    </div>
  );
}
