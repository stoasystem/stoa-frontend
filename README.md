# STOA Frontend

STOA learning platform frontend.

## Tech Stack

- React
- TypeScript
- Vite
- npm

## Local Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:5173/
```

Build production version:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Check code quality:

```bash
npm run lint
```

## Phase 2 Frontend Foundation

This project now includes:

- TailwindCSS
- shadcn-style local UI components
- React Router
- TanStack Query
- Zustand
- Axios
- lucide-react

## Phase 3 Core Product UI

This phase adds the first version of the STOA product interface.

Included pages:

- `/chat`
- `/dashboard`

Included UI modules:

- Conversation sidebar
- Chat message list
- Message bubbles
- Chat input
- Mock AI response state
- Teacher help placeholder
- Student dashboard cards
- Recent questions
- Weak topics
- Learning progress
- Teacher feedback

This phase uses mock data only. Backend integration is handled in Phase 4.

## Phase 4 Backend Integration

This phase connects the chat UI to the backend Chat API.

Required frontend environment variable:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Start frontend:

```bash
npm run dev
```

Expected backend endpoints:

- `GET /conversations`
- `GET /conversations/:conversationId`
- `POST /conversations`
- `POST /conversations/:conversationId/messages`
- `POST /teacher-help/request`

Local development URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- FastAPI Docs: http://localhost:8000/docs

FastAPI CORS must allow the frontend origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Testing-stage AI model strategy:

- The frontend calls only the unified backend Chat API.
- The frontend does not call OpenAI, Claude, Gemini, DeepSeek, Codex, or other model APIs directly.
- During the testing stage, the backend may use Codex as the temporary AI conversation provider.
- Later model provider changes should not require frontend API changes.

This phase does not implement streaming. AI responses are expected to be returned by the backend in the normal HTTP response.

## Phase 5 Streaming Chat and File Upload

This phase upgrades the chat experience from normal HTTP responses to streaming AI responses.

New capabilities:

- Streaming assistant responses
- Stop generation
- Retry failed user messages
- Create new conversation
- Upload homework images or PDFs
- Attach uploaded files to chat messages
- Teacher help request status

Frontend still calls only the unified STOA backend API. The testing-stage AI provider may continue to be Codex on the backend side. The frontend must not call model APIs directly.

Expected new endpoints:

- `POST /conversations/:conversationId/messages/stream`
- `POST /files`
- `GET /files/:fileId`
- `GET /teacher-help/request/:requestId`

Local frontend environment:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

File upload limits:

- Supported types: PNG, JPEG, PDF
- Maximum size: 10 MB per file
- Maximum pending attachments: 3

## Phase 6 Authentication and User Roles

This phase adds authentication, role-based routing, parent visibility, tutor help-request handling, and a local SQLite-backed test backend.

User roles:

- `student`
- `parent`
- `tutor`
- `admin`

Public routes:

- `/login`
- `/register`
- `/forgot-password`

Student routes:

- `/dashboard`
- `/chat`
- `/profile`
- `/learning-history`

Parent routes:

- `/parent`
- `/parent/children/:childId`
- `/parent/children/:childId/history`

Tutor routes:

- `/tutor`
- `/tutor/requests/:requestId`

Admin route:

- `/admin`

Expected backend endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `GET /students/me/profile`
- `PATCH /students/me/profile`
- `GET /students/me/learning-history`
- `GET /conversations`
- `GET /conversations/:conversationId`
- `POST /conversations`
- `POST /conversations/:conversationId/messages`
- `POST /conversations/:conversationId/messages/stream`
- `GET /parents/me/children`
- `GET /parents/me/children/:childId/summary`
- `GET /parents/me/children/:childId/history`
- `GET /tutors/me/help-requests`
- `GET /tutors/me/help-requests/:requestId`
- `PATCH /tutors/me/help-requests/:requestId`

Frontend token storage in this phase:

- `localStorage` key: `stoa_access_token`

Production security may later move to httpOnly cookies or refresh-token based flows.

### Local SQLite Test Backend

SQLite is used only for local functional testing. The frontend does not connect to SQLite directly. The frontend calls the local backend API, and the local backend reads and writes SQLite.

Local backend structure:

```text
Frontend
  -> HTTP
Local FastAPI backend
  -> SQLite local.db
```

The local database supports users, roles, profiles, parent-child links, conversations, messages, uploaded file metadata, teacher help requests, and learning history.

Install local backend dependencies:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
```

Seed local data:

```bash
cd backend
PYTHONPATH=. .venv/bin/python -m app.seed
```

Start local backend:

```bash
cd backend
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
```

Suggested seed accounts:

- `student@test.com / password123`
- `parent@test.com / password123`
- `tutor@test.com / password123`
- `admin@test.com / password123`

## Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Default API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Available Routes

- `/` Home
- `/login` Login
- `/register` Register
- `/dashboard` Student dashboard
- `/chat` Student chat product UI
- `/profile` Student profile
- `/learning-history` Student learning history
- `/parent` Parent dashboard
- `/parent/children/:childId` Child learning summary
- `/parent/children/:childId/history` Child learning history
- `/tutor` Tutor dashboard
- `/tutor/requests/:requestId` Tutor help-request detail
- `/admin` Admin placeholder

## Project Status

Phase 6: authentication, role routing, parent visibility, tutor help-request workflow, and local SQLite-backed testing backend.
