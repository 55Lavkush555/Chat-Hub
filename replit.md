# Workspace

## Overview

Full-stack real-time chat web application ("Relay") built as a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Real-time**: Socket.IO (server: socket.io, client: socket.io-client)
- **Authentication**: JWT (jsonwebtoken) + bcrypt password hashing
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Wouter (routing)

## Architecture

- `artifacts/api-server/` — Express backend with Socket.IO
- `artifacts/chat-app/` — React frontend (SPA) at path `/`
- `lib/db/` — Drizzle ORM schema (users, messages tables)
- `lib/api-spec/` — OpenAPI spec + codegen config
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

## Key Features

1. **Authentication**: JWT-based register/login; token stored in localStorage
2. **Users**: Online/offline status tracking via Socket.IO presence
3. **Real-time Chat**: Private 1-to-1 messaging via Socket.IO
4. **Typing Indicators**: Live "user is typing" indicator
5. **Message History**: PostgreSQL-persisted message history
6. **Search**: Real-time user search in sidebar
7. **Dark/Light Theme**: Toggle with localStorage persistence

## API Routes

- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user (JWT required)
- `GET /api/users?search=...` — List all users
- `GET /api/users/online` — List online users
- `GET /api/messages/:userId` — Get message history
- `POST /api/messages` — Send a message
- `WS /api/socket.io` — Socket.IO WebSocket connection

## Socket.IO Events

**Server → Client:**
- `new_message` — New message object
- `online_users` — Array of online user IDs
- `typing` — `{ userId, isTyping }` typing indicator

**Client → Server:**
- `join` — Signal user is online
- `typing` — `{ receiverId, isTyping }`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` — Secret for JWT signing (optional; defaults to dev key)
- `SESSION_SECRET` — Session secret (configured in Replit secrets)
