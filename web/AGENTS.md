# Flashcard App — Frontend Agent Rules

## Skills

## Project context
This is the Next.js frontend for a spaced repetition flashcard app. The backend is a Go REST API running on `http://localhost:8080/api/v1`. The app allows users to create decks, add cards, and study them using the SM-2 spaced repetition algorithm.

## Stack
- Next.js 14+ with App Router
- TypeScript (strict mode)
- Tailwind CSS for styling
- React Query (@tanstack/react-query) for server state
- Axios for HTTP requests (configured in src/lib/api.ts)
- lucide-react for icons

## Project structure
```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx         ← React Query provider, global styles
│   │   ├── page.tsx           ← Dashboard (deck list + due cards count)
│   │   ├── login/page.tsx     ← Login form
│   │   ├── decks/
│   │   │   ├── new/page.tsx   ← Create deck form
│   │   │   └── [deckId]/page.tsx ← Deck detail + card management
│   │   └── study/
│   │       └── [deckId]/page.tsx ← Study session (card flip + ratings)
│   ├── lib/
│   │   └── api.ts             ← Axios instance with JWT interceptor
│   └── types/
│       └── index.ts           ← Shared TypeScript types (Card, Deck, User, ReviewLog)
```

## Coding standards

### TypeScript
- Always type component props explicitly — never use `any`
- Use the shared types from `src/types/index.ts` for API data (Card, Deck, User, ReviewLog)
- Prefer `interface` over `type` for object shapes
- Always handle the loading and error states returned by useQuery

### React and Next.js
- All pages that use hooks must have `"use client"` at the top
- Use the App Router file conventions — no Pages Router patterns
- Use `useRouter` from `next/navigation`, not `next/router`
- Use `useParams` from `next/navigation` for dynamic route params
- Never fetch data with useEffect + useState — always use useQuery for server data
- After any mutation that changes a list, call `queryClient.invalidateQueries` with the relevant key

### React Query conventions
- Query keys follow this pattern:
  - `["decks"]` — all decks for the current user
  - `["deck", deckId]` — single deck by ID
  - `["cards", deckId]` — cards inside a specific deck
  - `["due-cards"]` — all due cards across all decks
  - `["due-cards", deckId]` — due cards for a specific deck
- Always destructure `isLoading` and `error` from useQuery and render appropriate UI for both states
- Use `useMutation` for all POST, PUT, DELETE operations — never call api.post directly in event handlers
- Never replace existing useQuery or useMutation calls — only style the JSX around them

### Styling
- Use Tailwind utility classes only — no custom CSS files or inline styles
- Color palette: `gray-950` background, `gray-900` cards, `gray-800` inputs, `indigo-600` primary actions
- Interactive elements must have hover states: `hover:bg-indigo-500`, `hover:border-indigo-500`
- Disabled states must use `disabled:opacity-50`
- All buttons that trigger async actions must show a loading state via `isPending` or local state
- Mobile-first: every layout must work at 375px width before adding responsive modifiers

### Accessibility
- All interactive elements must be keyboard accessible
- Buttons must have descriptive text or `aria-label`
- Images must have `alt` attributes
- Form inputs must have associated `<label>` elements
- Color must not be the only way to convey information (pair with text or icons)

### API communication
- All API calls go through `src/lib/api.ts` — never use fetch or a new axios instance directly
- The JWT token is attached automatically by the axios interceptor — never manually set Authorization headers
- Handle 401 responses via the interceptor (already configured to redirect to /login)
- Always handle errors in mutations with `onError` or a try/catch

## Forbidden actions
- Do not edit anything inside `api/` — that is the Go backend and out of scope
- Do not create new API client instances — use the one in `src/lib/api.ts`
- Do not add new dependencies without checking if an existing one already covers the need
- Do not use `localStorage` directly in components — it is only used in `src/lib/api.ts` for the token
- Do not use `useEffect` for data fetching
- Do not use the Pages Router (`pages/` directory)

## Design goals for the improvement pass
- The UI should feel clean and focused — no visual clutter
- Cards and containers use rounded corners (`rounded-xl`, `rounded-2xl`)
- Transitions on interactive elements: `transition-colors`, `transition-all duration-300`
- The study session screen is the most important — it must be smooth and distraction-free
- Empty states should be friendly and guide the user toward the next action