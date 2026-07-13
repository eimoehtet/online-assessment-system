# LightLearn Frontend (React)

Frontend project built with React + Vite.

It calls Node.js API routes using Axios, with a configurable base URL for your MongoDB-backed backend.

## API Routes Expected

- `GET /health`
- `GET /users`

Default backend base URL:

- `http://localhost:5000/api`

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Set your backend URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Install and Run

```bash
npm install
npm run dev
```

Open the app URL shown by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

## Project API Files

- `src/api/client.js`: shared Axios client.
- `src/api/routes.js`: route helpers used by components.
