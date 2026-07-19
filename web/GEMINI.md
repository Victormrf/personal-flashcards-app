# Flashcard App — Gemini Context

## What this project is
A Next.js frontend for a personal spaced repetition flashcard app. Users create decks, add cards, and study them using the SM-2 algorithm. The backend is a Go REST API — do not touch anything in `api/`.

## Your role
You are improving the frontend UI. Focus on making the existing screens more polished and usable. Do not change data fetching logic, routing structure, or API contracts unless explicitly asked.

## Architecture decisions already made — do not change these
- React Query is the only way data is fetched from the server. Never replace useQuery with useEffect + fetch.
- All HTTP calls go through `src/lib/api.ts`. Never create a second axios instance.
- JWT auth is handled by the axios interceptor in api.ts. Never manually attach tokens in components.
- Query keys are established and must stay consistent:
  - `["decks"]`, `["deck", deckId]`, `["cards", deckId]`, `["due-cards"]`, `["due-cards", deckId]`
- After any mutation, invalidate the relevant query key so the UI stays in sync.

## Types
All shared types are in `src/types/index.ts`:
- `Card` — id, deck_id, front, back, ease_factor, interval_days, repetitions, due_at, created_at
- `Deck` — id, user_id, name, description, created_at
- `User` — id, email, name, created_at
- `ReviewLog` — id, card_id, user_id, rating, interval_days, ease_factor, response_ms, reviewed_at

## Tailwind conventions in this project
- Background: `bg-gray-950` (page), `bg-gray-900` (cards), `bg-gray-800` (inputs)
- Primary action: `bg-indigo-600 hover:bg-indigo-500`
- Text: `text-white` (primary), `text-gray-400` (secondary), `text-gray-500` (muted)
- Borders: `border-gray-800`, focus: `focus:border-indigo-500`
- Radius: `rounded-lg` (inputs, small buttons), `rounded-xl` (cards), `rounded-2xl` (large cards)
- All interactive elements need `transition-colors` or `transition-all`

## Study session — handle with care
The study session (`app/study/[deckId]/page.tsx`) is the most critical screen. It has:
- A card flip animation using CSS 3D transforms — do not break this
- Keyboard shortcuts: Space to flip, 1/2/3/4 to rate
- A `useMutation` that submits the review, invalidates the cache, and advances to the next card
- A `startTime` ref that tracks response time in milliseconds

## What good output looks like
- Components are focused — one responsibility per component
- Loading states are always shown (spinner, skeleton, or "Loading..." text)
- Empty states guide the user toward an action rather than just saying "nothing here"
- Error states are user-friendly — no raw error objects shown to the user
- Mobile works at 375px width without horizontal scroll
- Animations are subtle — nothing that feels slow or distracting

## What to avoid
- Do not use `any` type
- Do not use inline styles — Tailwind only
- Do not add new npm packages without asking first
- Do not modify `src/lib/api.ts` or `src/types/index.ts` unless the task explicitly requires it
- Do not remove keyboard shortcuts from the study session
- Do not change the SM-2 rating values (1, 3, 4, 5) — they map to specific algorithm inputs