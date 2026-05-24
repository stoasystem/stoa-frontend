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

This phase uses mock data only. Backend integration will be handled in the next phase.

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
- `/chat` Mock chat product UI
- `/dashboard` Student dashboard product UI
- `/login` Login placeholder

## Project Status

Phase 3: core product UI prototype initialized with mock data.
