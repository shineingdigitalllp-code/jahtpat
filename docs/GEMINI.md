# GEMINI.md — Jhatpat (Antigravity / Gemini)

Mobile-first grocery delivery app. Next.js (web) + Node.js (api). Full spec: `docs/PRD.md`. UI reference: screenshots in `docs/design/` (build pixel-faithful to them).

## Working Rules (highest priority)
1. **Act immediately.** Do not scan the whole repo. Read only files directly needed for the task.
2. **Chat is terse.** No intros, recaps, praise, or explanations. Output: what changed (file list, one line each) or a blocking question. Max one question, only if truly blocked.
3. **No testing mid-build.** Do not write or run tests, or start dev servers to verify, until the owner says "start testing". Typecheck/lint only on request.
4. **Less code.** Smallest correct implementation. No speculative abstractions, no unused props, no dead code, no boilerplate comments, no placeholder files.
5. **No AI slop.** No emoji in code/UI, no decorative filler, no "TODO" scaffolds, no lorem ipsum, no redundant wrappers, no comments restating code.
6. **Don't ask permission for obvious work.** Make the best-practice decision, proceed, state it in one line.
7. **Don't touch what wasn't asked.** No drive-by refactors or dependency additions without need.

## Stack
- **Web:** Next.js (App Router) · TypeScript (strict) · Tailwind CSS · TanStack Query (server state) · Zustand (cart/UI state) · React Hook Form + Zod · Framer Motion (subtle only) · lucide-react icons
- **API:** Node.js · Express · TypeScript · Zod validation · Prisma ORM · MySQL · JWT (httpOnly cookies) · Razorpay
- **Tooling:** pnpm workspaces · ESLint · Prettier · Husky not required

## Folder Structure
```
jhatpat/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/                  # routes only: (auth), (shop), layout, loading.tsx, error.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ ui/                # primitives: Button, Input, Badge, Skeleton, Sheet, QtyStepper
│  │  │  │  ├─ layout/            # Header, BottomNav, PageShell
│  │  │  │  └─ features/          # cart/, product/, home/, checkout/, auth/
│  │  │  ├─ hooks/                # use-cart, use-products, use-auth
│  │  │  ├─ lib/                  # api client, utils, format (currency), constants
│  │  │  ├─ store/                # zustand stores
│  │  │  ├─ types/
│  │  │  └─ styles/globals.css    # tokens as CSS variables
│  │  └─ public/
│  └─ api/
│     ├─ src/
│     │  ├─ modules/              # auth, products, categories, cart, orders, payments, coupons, addresses
│     │  │  └─ <module>/ {routes, controller, service, schema}.ts
│     │  ├─ middlewares/          # auth, validate, error, rateLimit
│     │  ├─ config/               # env (Zod-validated), db, razorpay
│     │  ├─ utils/
│     │  └─ server.ts
│     └─ prisma/schema.prisma
├─ packages/shared/               # Zod schemas + shared types used by both apps
├─ docs/ {PRD.md, design/}
└─ CLAUDE.md · GEMINI.md
```
One component per file. Feature code lives in `components/features/<feature>`. Shared logic goes in `hooks/` or `lib/` — never duplicate.

## Code Standards
- TypeScript strict, no `any`. Named exports (default only for Next pages/layouts). `const` arrow functions or function declarations consistently — functions for components.
- Server Components by default; add `"use client"` only for interactivity (cart, steppers, forms, sheets).
- Naming: components `PascalCase.tsx`, everything else `kebab-case.ts`, hooks `use-*.ts`, constants `SCREAMING_SNAKE`.
- Imports via `@/` alias; order: react/next → libs → `@/` → relative.
- Money stored as integer **paise** in DB, formatted with one `formatINR()` util. Never compute totals on the client as source of truth.
- API: REST, `/api/v1/*`, consistent envelope `{ data }` / `{ error: { code, message } }`. Validate every input with Zod. Centralized error middleware. No try/catch in controllers (use async wrapper).
- Security: httpOnly + SameSite cookies, bcrypt, rate-limit auth routes, Helmet, CORS allowlist, parameterized queries via Prisma, verify Razorpay signatures server-side, never trust client prices.
- Env via validated config only; never read `process.env` elsewhere.

## Performance & UX (non-negotiable)
- **Optimistic updates** for cart add/remove/qty, wishlist toggle — update UI instantly, rollback on error with a toast.
- **Every async screen has a skeleton** (`loading.tsx` / `<Skeleton/>`) matching final layout dimensions — zero layout shift. No spinners for page loads; spinners only inside buttons.
- Buttons show pending state and disable on submit (no double submits). Debounce search (300ms).
- `next/image` with explicit sizes, `priority` on above-the-fold only, blur placeholders. Lazy-load below the fold.
- Prefetch on link intent; cache with TanStack Query (`staleTime` set per query); paginate/infinite-scroll lists.
- Fonts via `next/font`. No unused dependencies. Keep client bundle small; dynamic-import heavy sheets/modals.
- Every list handles: loading, empty, error. Every form handles: validation, pending, error.
- Animations: 150–250ms ease-out, opacity/transform only. Respect `prefers-reduced-motion`.

## UI/UX Standards
- Mobile-first, design width 390px; scale up gracefully (max content width 480px centered on desktop).
- Match the reference screenshots: spacing, radii, type scale, colors, shadows. Tokens live in `globals.css` / Tailwind theme — never hardcode hex in components.
- Touch targets ≥ 44px. Safe-area insets respected (sticky bottom bars use `env(safe-area-inset-bottom)`).
- Accessible: semantic HTML, labels, focus-visible rings, `aria-*` on steppers/toggles, 4.5:1 text contrast.
- Consistent components only from `components/ui`. No one-off styled buttons.

## Git
Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`). Small commits. Commit only when asked.

## Definition of Done (per task)
Matches design · responsive · skeleton/empty/error states · optimistic where applicable · typed · no console logs · no unused code.

## Agent Behavior (Antigravity)
- Skip planning artifacts, walkthroughs, and task lists unless asked. Execute directly.
- Do not open the browser agent or run verification until the owner says "start testing".
- Reference `docs/PRD.md` for requirements; do not re-summarize it.
