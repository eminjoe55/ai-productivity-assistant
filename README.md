# AI Productivity Assistant

A full-stack AI-powered productivity app: task management, meeting summarization, daily
planning, and a streaming AI chat assistant — built on React + TypeScript + FastAPI +
Claude.

## Stack

| Layer      | Tech                                                             |
|------------|-------------------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, React Router            |
| Backend    | FastAPI, SQLAlchemy (async), Pydantic v2                          |
| Database   | SQLite (dev) / PostgreSQL (prod, via Docker Compose)              |
| AI         | Anthropic Claude (`anthropic` Python SDK), streaming via SSE      |
| Deployment | Docker + Docker Compose                                           |

## Project structure

```
ai-productivity-assistant/
├── backend/
│   ├── app/
│   │   ├── core/        # config, database session
│   │   ├── models/      # SQLAlchemy models (Task, MeetingSummary, DailyPlan)
│   │   ├── schemas/     # Pydantic request/response schemas
│   │   ├── routers/     # tasks, meeting, planner, chat, dashboard, health
│   │   ├── services/    # ai_service.py (Claude calls) + prompts.py (prompt templates)
│   │   └── main.py      # app entrypoint, CORS, global exception handler
│   ├── tests/           # pytest suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/  # Sidebar, TaskCard, TaskFormModal, ui.tsx, ErrorBoundary
│   │   ├── pages/        # Dashboard, Tasks, MeetingSummarizer, Planner, Chat
│   │   ├── lib/api.ts    # typed fetch client incl. SSE streaming helper
│   │   ├── hooks/        # useTheme (dark/light), useToast
│   │   └── types/        # shared TS types
│   ├── nginx.conf        # reverse proxy for prod container
│   └── Dockerfile
└── docker-compose.yml
```

## Quick start — Docker (recommended)

Everything runs with a single command.

1. Add your Anthropic API key:
   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env and set ANTHROPIC_API_KEY=sk-ant-...
   ```
2. Start everything:
   ```bash
   docker compose up --build
   ```
3. Open the app: **http://localhost:3000**
   Backend API docs (Swagger): **http://localhost:8000/docs**

This spins up three containers: `frontend` (nginx serving the built React app,
proxying `/api` to the backend), `backend` (FastAPI on port 8000), and `db`
(PostgreSQL 16). Data persists in named Docker volumes.

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # then set ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

The dev default uses SQLite (`sqlite+aiosqlite:///./app.db`), so no database
setup is needed to get started locally.

Run tests:
```bash
pip install httpx pytest pytest-asyncio
pytest -q
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite's dev server proxies `/api/*` to `http://localhost:8000` (see
`vite.config.ts`), so make sure the backend is running first. Open
**http://localhost:5173**.

## Environment variables (backend/.env)

| Variable            | Description                                            | Default                                  |
|---------------------|----------------------------------------------------------|-------------------------------------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (**required** for AI features)    | —                                         |
| `ANTHROPIC_MODEL`   | Model to use                                              | `claude-sonnet-4-5`                       |
| `DATABASE_URL`      | SQLAlchemy async connection string                        | `sqlite+aiosqlite:///./app.db`            |
| `CORS_ORIGINS`      | Comma-separated allowed origins                           | `http://localhost:5173,http://localhost:3000` |
| `ENVIRONMENT`       | `development` / `production`                              | `development`                             |

Get an Anthropic API key at https://console.anthropic.com/.

## Feature overview

- **Dashboard** — today's tasks, pending/completed counts, productivity score, upcoming
  deadlines, recent meeting summaries.
- **Task Manager** — full CRUD, search/filter/sort, and AI actions per task: suggest
  priority, estimate completion time, break into subtasks, suggest a deadline, plus a
  one-click "suggest today's focus" across all open tasks.
- **Meeting Summarizer** — paste notes or upload a `.txt`/`.md` file; Claude returns an
  executive summary, discussion points, decisions, action items (with owner/deadline),
  risks, and next steps. Export as Markdown, plain text, or copy to clipboard. History is
  persisted.
- **Daily Planner** — give it your working hours, open tasks (pulled automatically),
  stated priorities, and meetings; Claude returns a time-blocked schedule with deep-work
  sessions, breaks, and productivity suggestions.
- **AI Chat Assistant** — streaming responses (Server-Sent Events), suggested prompts,
  conversation history within the session, and a "Stop" button to cancel generation
  mid-stream.
- **Dark / light mode**, responsive layout, toast notifications, loading skeletons, and a
  top-level error boundary.

## API reference

| Method | Path                              | Description                          |
|--------|------------------------------------|----------------------------------------|
| GET    | `/health`                          | Health check                           |
| GET    | `/dashboard`                       | Aggregated dashboard data              |
| POST   | `/tasks`                           | Create task                            |
| GET    | `/tasks`                           | List tasks (search/filter/sort)        |
| GET    | `/tasks/{id}`                      | Get task                               |
| PUT    | `/tasks/{id}`                      | Update task                            |
| DELETE | `/tasks/{id}`                      | Delete task                            |
| POST   | `/tasks/{id}/complete`             | Mark complete                          |
| POST   | `/tasks/{id}/archive`              | Archive                                |
| POST   | `/tasks/{id}/ai/suggest-priority`  | AI: suggest priority                   |
| POST   | `/tasks/{id}/ai/estimate-time`     | AI: estimate completion time           |
| POST   | `/tasks/{id}/ai/subtasks`          | AI: break into subtasks                |
| POST   | `/tasks/{id}/ai/suggest-deadline`  | AI: suggest deadline                   |
| GET    | `/tasks/ai/suggest-focus`          | AI: suggest today's focus task         |
| POST   | `/summarize`                       | AI: summarize meeting notes            |
| GET    | `/summarize/history`               | List past summaries                    |
| POST   | `/planner`                         | AI: generate daily schedule            |
| GET    | `/planner/history`                 | List past plans                        |
| POST   | `/chat`                            | AI chat, streamed via SSE              |

Full interactive docs at `/docs` (Swagger UI) once the backend is running.

## Notes on scope

This implementation covers the PRD's in-scope items: task management, meeting
summarization, daily planning, AI chatbot, dashboard, Docker deployment, streaming AI
responses, and a responsive UI. Authentication was marked optional in the PRD and is not
included in this pass — the `services`/`routers` layering makes it straightforward to add
JWT auth later (see "Future Enhancements" in the PRD). PDF upload for meeting notes,
Kanban board view, and charts are noted as nice-to-haves in the PRD; the current build
supports `.txt`/`.md` upload and a card-based task list, and can be extended incrementally.
