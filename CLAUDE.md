## Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreetments based on templates in the templates directoryy. The use of AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in catalog.json file in project root. included here:

@catalog.json

Before we start: the initial implementation is a frontend-only prototype that only supports the Mutual NDA document with no AI chat. (Update: as of PL-4, the full-stack foundation — backend, database, Docker packaging, and a fake login screen — is in place. As of PL-5, the Mutual NDA document is now created through an AI chat instead of a form. See "Implementation status" at the end of this file. Still only the Mutual NDA document.)

## Development process

When instructed to build a feature:
    1. Use your Atlassian tools to read the feature instructions from Jira
    2. Develop the feature - do not skip any step from the feature-dev 7 step process
    3. Thoroughly test the feature with unit tests and integration tests and fix any issues
    4. Submit a PR using your github tools

## AI Design

When writing code to make calls to LLMs, use your `openrouter_llm` skill to use LiteLLM via OpenRouter pointing to a free model (e.g., `nvidia/llama-3.1-nemotron-70b-instruct:free`). You should use Structured Outputs so that you can interpret the results and populate fields in the legal document reliably.

## Technical design

The entire project should be packaged into a Docker container.
The backend should be in backend/ and be a uv project, using FastAPI.
The database should use SQLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.
The frontend should be in frontend/, statically built and served via FastAPI (implemented as of PL-4 — see "Implementation status"). There should be a scripts in scripts/ for:

```bash
# Mac
scripts/start-mac.sh   # Start
scripts/stop-mac.sh    # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

## Color Scheme

• Accent Yellow: #ecad0a
• Blue primary: #209dd7
• Purple Secondary: #753991 (submit buttons)
• Dark Navy: #032147 (headings)
• Gray Text: #888888

## Implementation status

- **PL-3 — Mutual NDA Creator**: done. Frontend-only Next.js prototype (`frontend/`) for the Mutual NDA document; fills in `templates/Mutual-NDA.md` client-side, no backend or persistence.
- **PL-4 — V1 foundation**: done. Added `backend/` (uv + FastAPI) with a SQLite `users` table that's wiped and recreated on every app startup, plus `/api/auth/signup` and `/api/auth/signin` endpoints (bcrypt-hashed passwords, no session/JWT — no routes are gated yet). Added a `/login` screen (sign in / sign up) that calls those endpoints and, on success, sends the user to `/`. The frontend now builds as a static export and is served directly by FastAPI, so the whole app runs from one container on port 8000. Docker packaging (`backend/Dockerfile`, `docker-compose.yml`) and start/stop scripts for mac/linux/windows are in place per the Technical design above. Still only the Mutual NDA document, no AI chat, and no real authentication enforcement — those remain for later tickets.
- **PL-5 — AI chat for the Mutual NDA**: done. The form-based field entry is replaced by a freeform chat (`frontend/components/NdaChat.tsx`) that swaps into the same two-pane layout used before — the document preview pane is unchanged and still updates live as fields are filled in, now via the chat instead of typing into inputs. Chat history and extracted fields are ephemeral/client-side only, matching the app's no-persistence design; no new SQLite table. The backend gains a single stateless endpoint, `POST /api/chat/mnda` (`backend/app/chat.py`), which sends the conversation plus already-known fields to a free OpenRouter model via LiteLLM (`backend/app/llm.py`), with Structured Outputs (Pydantic v2, camelCase aliases matching the frontend's field names) and a fallback to a second free model if the first fails. Still only the Mutual NDA document, and still no real authentication enforcement — those remain for later tickets.