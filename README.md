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
- `/chat` Backend-integrated chat product UI
- `/dashboard` Student dashboard product UI
- `/login` Login placeholder

## Project Status

Phase 5: streaming chat, upload attachments, retry, stop generation, and teacher-help status workflow.
