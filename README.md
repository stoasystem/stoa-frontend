# stoa-frontend

React 19 + TypeScript frontend for the STOA platform.

## Stack

- React 19 · TypeScript · Vite
- Zustand (state) · TanStack Query (server state)
- AWS Amplify JS (Cognito auth)
- Axios (HTTP client with JWT interceptor)

## Setup

```bash
npm install
cp .env.example .env   # fill in VITE_API_URL + VITE_COGNITO_*
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_COGNITO_USER_POOL_ID` | From StoaAuthStack output |
| `VITE_COGNITO_CLIENT_ID` | From StoaAuthStack output (role-specific client) |
