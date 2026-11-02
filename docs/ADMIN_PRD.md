# ADMIN_PRD — Jhatpat Admin Panel

Companion to `docs/PRD.md` (storefront) and `CLAUDE.md` (code standards). This file defines the **admin panel only**: architecture, data changes, API, design system, screens and build phases. Place it at `docs/ADMIN_PRD.md`.

---

## 0. Agent Instructions

1. Read in order: `CLAUDE.md` → `docs/PRD.md` → this file. Then read only the files the current phase touches.
2. Build **one phase at a time** (§14). Finish it, reply with the file list (one line per file) and `Phase N done`, then **stop**. Start the next phase only when the owner says "next".
3. Every rule in `CLAUDE.md` still applies: terse chat, less code, no placeholder files, no emoji, no TODO scaffolds, no tests or dev-server runs until the owner says "start testing".
4. Reuse, do not rebuild: `AppError`, `env`, validate/error/rateLimit middlewares, the Prisma client, the async wrapper, `packages/shared`. Follow the existing `routes / controller / service / schema` module layout.
5. If this file and `CLAUDE.md` conflict on code style, `CLAUDE.md` wins. For admin behavior and UI, this file wins.
6. Decisions here are final. Do not ask permission for anything covered. Ask at most one question, only when truly blocked.
7. UI must follow §7–§9 exactly. Never introduce colors, fonts, radii or shadows that are not in the tokens.

---

## 1. Overview & Scope

**Product:** a full back-office for the single-store Jhatpat grocery app. One store, one catalog, one DB (`jhatpat`).

**Users:** store owner, managers, and counter/packing staff. Used on a desktop at the counter and on a phone while moving around the store.

**In scope (v1):**
Admin auth (register with approval, login, logout, forced password change) · Dashboard with real stats · Orders (full lifecycle) · Payments (status, COD collection, refunds) · Products (CRUD, images, stock, bulk) · Categories · Customers · Coupons · Banners · Analytics · Team & roles · Store settings · Activity log · Global search · Light and dark mode.

**Out of scope (v1):** multi-store, rider app, websockets/push (polling only), email/SMS/WhatsApp sending, GST invoices, purchase orders and supplier management, multi-language.

---

## 2. Architecture Decisions (final)

| Area | Decision |
|---|---|
| Location | New workspace app `apps/admin`: Next.js App Router, TypeScript strict, Tailwind. Port **3001**. Add scripts `dev:admin` and include it in `dev:all`. |
| Backend | Extend `apps/api` under `/api/v1/admin/*`. No new backend, same DB, same Prisma client. |
| Browser to API | Admin app proxies via `next.config.ts` rewrites: `/api/:path*` and `/uploads/:path*` go to `API_ORIGIN`. The browser only talks to the admin origin: no CORS, cookie lives on the admin origin. |
| Auth | Separate `AdminUser` table. JWT with `aud: "admin"` (same `JWT_SECRET`), cookie `jp_admin`, httpOnly, SameSite=Lax, `Path=/api/v1/admin`, Secure in production. Session 12h; 30d with "Keep me signed in". bcryptjs cost 12. |
| Route protection | The cookie path does not match app routes, so Next middleware cannot read it. `(app)/layout.tsx` renders an `AuthGate` that calls `GET /admin/auth/me`: skeleton while loading, redirect to `/login` on 401, redirect to `/change-password` when `mustChangePassword`. Real authorization is always in the API. |
| Account status | `requireAdmin` loads the admin by id on **every** request and rejects non-`active` accounts, so suspensions apply instantly. |
| CSRF | Mutating admin requests must be `application/json` (or multipart for uploads) and their `Origin` must be in `ADMIN_ORIGINS`. |
| Env | API: add `ADMIN_ORIGINS` (default `http://localhost:3001`) to the Zod env. Admin `.env.local`: `API_ORIGIN=http://localhost:4000`. Never read `process.env` outside config. |
| Data fetching | TanStack Query, client-side. `staleTime` per query. Mutations are optimistic where it is a single toggle or status change; otherwise show pending state. |
| Pagination | Admin tables use offset pagination: `?page=1&pageSize=20` (max 100). Response `{ data, meta: { page, pageSize, total } }`. |
| Money | Integer paise everywhere. UI inputs take rupees and convert with one `rupeesToPaise()` util; display with the existing `formatINR()` pattern (copy to `apps/admin/src/lib/format.ts`, or move to `packages/shared`). |
| Time | DB stores UTC. All grouping, ranges and display use **IST (UTC+05:30)**. One `ist.ts` util on the API, one `formatDateIST()` in the UI. |
| Deletes | Products and categories: deactivate by default; hard delete only if they have no order history. Banners: hard delete. Coupons: hard delete only if never used, otherwise deactivate. |
| Uploads | `multer` memory storage (5 MB, jpeg/png/webp, magic-byte check) then `sharp`: max 1600px, convert to webp, plus a 400px thumbnail. Saved to `apps/api/uploads/{products,categories,banners}/<uuid>.webp` (gitignored), served at `/uploads/*` with long cache headers. Stored URL form: `/uploads/products/<uuid>.webp`. Existing `/images/catalog/*` URLs remain valid. Production note: swap the writer for S3/R2 behind the same `saveImage()` function. |
| Audit | Every mutating admin action writes an `ActivityLog` row through one `audit()` helper. |
| Live updates | Polling only: `GET /admin/counts` every 20s, dashboard queue every 30s, orders list every 20s while the tab is visible. |
| Allowed new deps (admin) | `@radix-ui/*` primitives, `cmdk`, `sonner`, `recharts`, `@tanstack/react-table`, `@dnd-kit/*`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`. Nothing else without a stated need. |
| Allowed new deps (api) | `multer`, `sharp`. |

---

## 3. Roles & Permissions

Roles: `owner`, `manager`, `staff`. API guards: `requireAdmin` (any active admin), `requireRole('owner','manager')`, `requireRole('owner')`. The UI hides what the role cannot do; the API enforces it.

| Area | Owner | Manager | Staff |
|---|---|---|---|
| Dashboard | Yes | Yes | Yes |
| Orders: view, change status, rider, note, cancel | Yes | Yes | Yes |
| Payments: view | Yes | Yes | No |
| Payments: mark COD paid, refund | Yes | Yes | No |
| Customers: view | Yes | Yes | View |
| Customers: block, wallet adjust | Yes | Yes | No |
| Products: view | Yes | Yes | View, stock edit only |
| Products: create, edit, delete, bulk | Yes | Yes | No |
| Categories, Banners, Coupons | Yes | Yes | No |
| Analytics | Yes | Yes | No |
| Activity log | Yes | View | No |
| Team, Settings | Yes | No | No |
| Own account (profile, password, theme) | Yes | Yes | Yes |

Hard rules: an admin cannot change or suspend their own role/status; at least one active owner must always exist.

---

## 4. Data Model Changes (Prisma)

One migration: `pnpm --filter @jhatpat/api db:migrate --name admin_panel`. Existing rows get defaults. **Do not seed an admin**: the first registration creates the owner.

```prisma
enum AdminRole   { owner manager staff }
enum AdminStatus { pending active suspended }

model AdminUser {
  id                 String       @id @default(cuid())
  name               String       @db.VarChar(60)
  email              String       @unique
  passwordHash       String
  role               AdminRole    @default(staff)
  status             AdminStatus  @default(pending)
  mustChangePassword Boolean      @default(false)
  lastLoginAt        DateTime?
  createdAt          DateTime     @default(now())
  logs               ActivityLog[]
  walletTxns         WalletTransaction[]
}

model ActivityLog {
  id        Int       @id @default(autoincrement())
  adminId   String
  action    String    @db.VarChar(60)   // entity.verb, e.g. order.status_changed
  entity    String    @db.VarChar(30)
  entityId  String    @db.VarChar(64)
  meta      Json?
  ip        String?   @db.VarChar(45)
  createdAt DateTime  @default(now())
  admin     AdminUser @relation(fields: [adminId], references: [id])

  @@index([entity, entityId])
  @@index([createdAt])
}

model WalletTransaction {
  id          Int       @id @default(autoincrement())
  userId      String
  adminId     String
  amountPaise Int                       // signed: credit > 0, debit < 0
  reason      String    @db.VarChar(120)
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  admin       AdminUser @relation(fields: [adminId], references: [id])

  @@index([userId, createdAt])
}

model StoreSetting {
  id                     Int      @id @default(1)   // single row
  name                   String   @default("Jhatpat") @db.VarChar(60)
  phone                  String?  @db.VarChar(15)
  address                String?  @db.VarChar(191)
  isOpen                 Boolean  @default(true)
  etaMinutes             Int      @default(10)
  deliveryFeePaise       Int
  freeDeliveryAbovePaise Int
  minOrderPaise          Int      @default(0)
  lowStockThreshold      Int      @default(10)
  updatedAt              DateTime @updatedAt
}
```

Changes to existing models:

| Model | Add |
|---|---|
| `User` | `isBlocked Boolean @default(false)`; relation `walletTxns WalletTransaction[]` |
| `Product` | `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `@@index([stock])` |
| `Order` | `razorpayPaymentId String? @unique`, `refundedPaise Int @default(0)`, `cancelledAt DateTime?`, `cancelReason String? @db.VarChar(120)`, `adminNote String? @db.VarChar(255)`, `@@index([status, createdAt])`, `@@index([createdAt])` |

Notes for the agent:
- Seed `StoreSetting` with the delivery fee and free-delivery threshold **currently hardcoded in the checkout module** (read that module once to copy the values). Phase 7 replaces those constants with this row.
- Payments have no table of their own. A payment is the `Order` payment fields (`paymentMethod`, `paymentStatus`, `razorpayOrderId`, `razorpayPaymentId`, `refundedPaise`). Verify that the existing Razorpay verify flow stores `razorpayPaymentId`; add it if missing.
- Coupon usage is derived: count of `Order` rows by `couponCode`.

---

## 5. API Spec (`/api/v1/admin`)

Conventions: envelope `{ data }` / `{ error: { code, message } }`; Zod on every input; centralized error middleware; every mutation calls `audit()`. Roles: **S** = any active admin, **M** = manager+, **O** = owner only.

### Auth
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/auth/setup-status` | public | `{ needsSetup }` true when no admin exists |
| POST | `/auth/register` | public | `{ name, email, password }`. If no admin exists: create `owner`/`active` and sign in. Else create `staff`/`pending`, return `{ status: "pending" }`. |
| POST | `/auth/login` | public | `{ email, password, remember }`. Errors: `INVALID_CREDENTIALS` (same message for unknown email and wrong password), `ACCOUNT_PENDING`, `ACCOUNT_SUSPENDED`. Updates `lastLoginAt`. |
| POST | `/auth/logout` | S | clears cookie |
| GET | `/auth/me` | S | `{ id, name, email, role, mustChangePassword }` |
| POST | `/auth/change-password` | S | `{ currentPassword, newPassword }`; clears `mustChangePassword` |

Password policy: min 10 chars, at least one letter and one number. Login rate limit: 10 requests / 15 min per IP, plus a 15-minute lock after 5 consecutive failures for the same email (in-memory map is enough for v1). Register: 5 requests / hour per IP.

### Dashboard, search, counts
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/dashboard?range=today\|7d\|30d\|90d` | S | single call, shape in §6 |
| GET | `/counts` | S | `{ newOrders, activeOrders, lowStock, pendingAdmins }` for sidebar badges and bell. `pendingAdmins` only for owner. |
| GET | `/search?q=` | S | top 5 each of orders (code, name, mobile), products (name), customers (name, mobile). Staff does not get customers. |

### Orders
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/orders` | S | `status, paymentStatus, method, from, to, q, sort, page, pageSize`; also returns per-status counts for the tabs |
| GET | `/orders/:code` | S | order, items with product thumbnails, customer, address, timeline, activity entries |
| PATCH | `/orders/:code/status` | S | `{ status, reason? }`, state machine below |
| PATCH | `/orders/:code/delivery` | S | `{ riderName, riderPhone, etaAt? }` |
| PATCH | `/orders/:code/note` | S | `{ note }` |
| GET | `/orders/export.csv` | M | same filters, streams CSV |

**Status state machine** (one map in `packages/shared`, used by API and UI):

| From | Allowed next |
|---|---|
| `pending_payment` | `placed` (system only, on payment verify), `cancelled` |
| `placed` | `preparing`, `cancelled` |
| `preparing` | `out_for_delivery`, `cancelled` |
| `out_for_delivery` | `delivered`, `cancelled` |
| `delivered`, `cancelled` | terminal |

Side effects, all inside one Prisma transaction with the audit entry:
- Guard with `updateMany({ where: { code, status: from } })`. Zero rows updated means 409 `CONFLICT` ("Order was updated by someone else, refresh").
- `preparing`: set `preparingAt`.
- `out_for_delivery`: requires `riderName` and `riderPhone` (400 otherwise); set `outForDeliveryAt`; if `etaAt` is empty set it to now + `etaMinutes`.
- `delivered`: set `deliveredAt`; if method is `cod`, set `paymentStatus = paid`.
- `cancelled`: `reason` required; set `cancelledAt`, `cancelReason`; **restore stock** (increment each item's qty). If the order was paid online it stays `paid` and appears under "Refund due" in Payments.

### Products
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/products` | S | `q, categoryId, status=active\|inactive, stock=low\|out, tag, sort, page, pageSize`; returns tab counts |
| GET | `/products/:id` | S | with images |
| POST | `/products` | M | create with `images: [{ url }]` (order = sortOrder) |
| PUT | `/products/:id` | M | full replace; image set is synced (removed rows deleted, order rewritten) |
| PATCH | `/products/:id/quick` | S* | `{ stock?, pricePaise?, mrpPaise?, isActive? }`. *Staff may send `stock` only. |
| POST | `/products/bulk` | M | `{ ids, action: "activate"\|"deactivate"\|"set_category", categoryId? }` |
| DELETE | `/products/:id` | M | hard delete only when it has no `OrderItem`; else 409 "Has order history, deactivate instead" |
| GET | `/products/export.csv` | M | |

Validation: `pricePaise > 0` and `<= mrpPaise`; `stock >= 0` integer; `categoryId` must be an active **subcategory** (a category with a `parentId`); 1 to 8 images; `slug` auto-generated from name on create, made unique with a numeric suffix, editable afterwards; `description` max 2000.

### Categories
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/categories` | M | tree with `productCount`, includes inactive |
| POST / PUT | `/categories`, `/categories/:id` | M | max depth 2; `parentId` must be a top-level category |
| PATCH | `/categories/reorder` | M | `{ items: [{ id, sortOrder }] }` |
| DELETE | `/categories/:id` | M | only when no children and no products |

### Banners & Coupons
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/banners?placement=` | M | placement `home`, `offers`, or category banners (`categoryId` set) |
| POST / PUT / DELETE | `/banners`, `/banners/:id` | M | `link` must start with `/` |
| PATCH | `/banners/reorder` | M | |
| GET | `/coupons` | M | with computed `usedCount` |
| POST / PUT | `/coupons`, `/coupons/:id` | M | `code` uppercased and unique; `percent` value 1 to 100; `flat` value > 0 paise; `free_delivery` value 0; `validTo > validFrom` |
| DELETE | `/coupons/:id` | M | only when `usedCount = 0` |

### Customers & Payments
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/customers` | S | `q, blocked, sort=recent\|orders\|spend, page` with order count and lifetime spend |
| GET | `/customers/:id` | S | profile, addresses, stats, recent orders, wallet transactions |
| PATCH | `/customers/:id/block` | M | `{ blocked }` |
| POST | `/customers/:id/wallet` | M | `{ amountPaise (signed), reason }`; creates `WalletTransaction` and updates `walletPaise` atomically; balance may not go negative |
| GET | `/payments` | M | `status, method, from, to, q, tab=refund_due`; also returns range summary: collected, COD pending, failed, refunded |
| PATCH | `/payments/:code/mark-paid` | M | COD only |
| POST | `/payments/:code/refund` | M | `{ amountPaise? }` (default: remaining). Calls Razorpay refund API, increments `refundedPaise`; `paymentStatus = refunded` when fully refunded. Returns 503 `PAYMENTS_NOT_CONFIGURED` if Razorpay keys are missing. |

### Team, Settings, Activity, Uploads, Analytics
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/team` | O | all admins |
| PATCH | `/team/:id` | O | `{ role?, status? }` (approve = `status: active`); guards in §3 |
| DELETE | `/team/:id` | O | only for `pending` (reject) |
| POST | `/team/:id/reset-password` | O | generates a temp password, returns it **once**, sets `mustChangePassword` |
| GET / PUT | `/settings` | O | `StoreSetting` row |
| GET | `/activity` | M | `entity, adminId, from, to, page` |
| POST | `/uploads?kind=product\|category\|banner` | M, staff blocked | multipart field `file`; returns `{ url, thumbUrl }` |
| GET | `/analytics?from&to&groupBy=day\|week\|month` | M | revenue and orders series, orders by hour of day (IST), sales by category, top 10 products, new vs returning customers, cancellation reasons |

Storefront integration endpoint (public, used in Phase 7): `GET /api/v1/store` returns `{ name, isOpen, etaMinutes, deliveryFeePaise, freeDeliveryAbovePaise, minOrderPaise }`.

---

## 6. Dashboard Metrics (real data, exact definitions)

- **Valid order** = `status NOT IN (cancelled, pending_payment)` AND `paymentStatus != failed`.
- **Revenue** = `SUM(totalPaise)` of valid orders in range. **Orders** = count of valid orders. **AOV** = revenue / orders (0 when no orders). **New customers** = `User.createdAt` in range.
- Each KPI is `{ value, previous, deltaPct }`; `previous` is the immediately preceding period of equal length (today compares with yesterday; delta is `null` when previous is 0).
- **Range boundaries** are computed in IST and converted to UTC for queries. Buckets: hourly for `today`, daily otherwise. Group with `DATE(DATE_ADD(createdAt, INTERVAL 330 MINUTE))` (and `HOUR(...)` for hourly) via `prisma.$queryRaw`. **Fill missing buckets with zeros** in the service so the chart axis is continuous.
- `$queryRaw` returns `BigInt` for `COUNT/SUM`: convert to `Number` before responding, or JSON serialization fails.
- **Avg delivery time** = `AVG(TIMESTAMPDIFF(MINUTE, createdAt, deliveredAt))` over delivered orders in range (null when none). **Cancellation rate** = cancelled / (valid + cancelled) in range.
- **Queue (needs attention)** is live and ignores range: orders in `placed`, oldest first, limit 8. **Active orders** = `placed + preparing + out_for_delivery`.
- **Low stock** = active products with `stock <= StoreSetting.lowStockThreshold`, ascending by stock, limit 6 plus the total count.
- **Top products** = `OrderItem` joined to valid orders in range, by units, then revenue (`qty * pricePaise`), limit 5.
- **Payment split** = valid orders grouped by `paymentMethod` (orders, revenue).
- Cache the whole response in memory for 15s per range.

```ts
type Kpi = { value: number; previous: number; deltaPct: number | null };

type DashboardResponse = {
  range: { key: "today" | "7d" | "30d" | "90d"; from: string; to: string; bucket: "hour" | "day" };
  kpis: { revenuePaise: Kpi; orders: Kpi; aovPaise: Kpi; newCustomers: Kpi };
  ops: { avgDeliveryMinutes: number | null; cancellationRate: number; activeOrders: number; lowStockCount: number };
  series: { t: string; revenuePaise: number; orders: number }[];
  statusCounts: Record<OrderStatus, number>;            // within range
  queue: { code: string; customerName: string; itemCount: number; totalPaise: number; createdAt: string }[];
  lowStock: { id: number; name: string; image: string | null; unit: string; stock: number }[];
  topProducts: { id: number; name: string; image: string | null; units: number; revenuePaise: number }[];
  paymentSplit: { method: PaymentMethod; orders: number; revenuePaise: number }[];
  recentOrders: { code: string; customerName: string; itemCount: number; totalPaise: number; paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; status: OrderStatus; createdAt: string }[];
};
```

---

## 7. Design System

### 7.1 Direction
A native macOS app in a browser: calm, content-first, hairline borders, restrained color, generous but efficient spacing. The interface should disappear; the data is the hero.

**Banned (this is what "AI slop" looks like here):**
- Gradient hero cards, purple/blue gradients, glow, blobs, glassmorphism on content cards.
- A colored circle behind every icon, icon-in-box on every KPI.
- Card inside card inside card; heavy drop shadows on cards.
- Stock illustrations, emoji, "Welcome back" greetings, fake avatars, lorem ipsum, fake data.
- Rainbow charts, donut charts for 3 categories, bouncing or springy animation.
- Oversized rounded corners (> 14px), oversized padding that wastes the screen, all-caps everywhere.

### 7.2 Color tokens
Define as CSS variables in `styles/globals.css`, mapped into the Tailwind theme. Components never use hex. Light is default; dark follows the system with a manual override stored in the UI store (`system | light | dark`), applied via `data-theme` on `<html>`.

| Token | Light | Dark |
|---|---|---|
| `--canvas` (window background) | `#F5F5F7` | `#1C1C1E` |
| `--surface` (cards, tables, inputs) | `#FFFFFF` | `#262628` |
| `--surface-2` (table header, hover, zebra) | `#FAFAFB` | `#2C2C2F` |
| `--sidebar` | `rgba(246,246,248,0.72)` + `backdrop-filter: blur(24px) saturate(1.4)` | `rgba(32,32,34,0.72)` + same blur |
| `--border` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.10)` |
| `--border-strong` | `rgba(0,0,0,0.14)` | `rgba(255,255,255,0.18)` |
| `--ink` | `#1D1D1F` | `#F5F5F7` |
| `--ink-2` | `#48484D` | `#C7C7CC` |
| `--muted` | `#6E6E73` | `#98989D` |
| `--faint` | `#A1A1A6` | `#636366` |
| `--accent` (brand green, matches storefront) | `#2C7A10` | `#5DB83C` |
| `--accent-hover` | `#256A0D` | `#6FC84F` |
| `--accent-soft` | `rgba(44,122,16,0.10)` | `rgba(93,184,60,0.16)` |
| `--accent-ink` (text on accent) | `#FFFFFF` | `#0F2A06` |
| `--ring` (focus) | `rgba(44,122,16,0.30)` | `rgba(93,184,60,0.40)` |

Semantic colors (each has `text`, `soft` background and `dot`):

| Name | Text / Dot (light) | Soft bg (light) | Used for |
|---|---|---|---|
| `neutral` | `#6E6E73` | `rgba(0,0,0,0.05)` | pending_payment, inactive |
| `info` | `#0A66D6` | `rgba(10,102,214,0.10)` | placed (new) |
| `warning` | `#9A5B00` | `rgba(255,159,10,0.16)` | preparing, pending payment, low stock |
| `indigo` | `#4B46C9` | `rgba(88,86,214,0.12)` | out_for_delivery |
| `success` | `#1E7A3C` | `rgba(48,168,86,0.14)` | delivered, paid |
| `danger` | `#C7222D` | `rgba(215,0,21,0.10)` | cancelled, failed, out of stock |

Dark variants: lighten text by about 20% and keep the same soft alpha on a dark surface. Status is **always** shown as a `StatusPill` (soft background, text color, 6px dot, label). Never rely on color alone.

### 7.3 Typography
- Body font **Inter** (variable) via `next/font`. Wordmark only: **Fraunces**, deep green, lowercase "jhatpat" (same as storefront).
- Numbers always use `font-variant-numeric: tabular-nums`.
- Weights: 400, 500, 600 only. Titles use `letter-spacing: -0.01em`.

| Role | Desktop | Mobile |
|---|---|---|
| Page title | 22 / 28, 600 | 20 / 26, 600 |
| Section / card title | 14 / 20, 600 | 15 / 20, 600 |
| Body, table cells | 13 / 20 | 14 / 20 |
| Caption, labels, meta | 12 / 16, muted | 12 / 16 |
| KPI value | 28 / 32, 600 | 24 / 28, 600 |
| Inputs | 13 | **16** (prevents iOS zoom) |

### 7.4 Shape, density, elevation
- Radius: dialog/sheet 14px, card 12px, control (button, input, select) 8px, pill 999px, avatar 999px.
- Borders: 1px `--border`. Cards have **no shadow**. Shadows only on floating layers (popover, dropdown, dialog, toast): `0 8px 30px rgba(0,0,0,0.12), 0 0 0 1px var(--border)`.
- Control height: 32px desktop, 44px mobile (touch). Table row: 48px desktop, card list on mobile. Sidebar item: 32px.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32. Page padding: 32px (xl), 24px (lg), 16px (mobile). Card padding: 16–20px.
- Focus: 3px `--ring` around the element (focus-visible only), never remove outlines.

### 7.5 Motion
150–200ms, `ease-out`, opacity and transform only. Dialog: fade + scale 0.98 to 1. Sheet: slide from edge. Sidebar collapse: width transition 200ms. Skeleton: subtle shimmer. Honor `prefers-reduced-motion` (disable everything except opacity).

### 7.6 Icons & charts
- Icons: `lucide-react`, 16px (18px in the mobile tab bar), stroke 1.75, `currentColor`. No emoji.
- Charts: Recharts. One accent series per chart; horizontal gridlines only, 1px `--border`; axis labels 11px `--muted`; tooltip styled as a popover; no legend for single series; area fill is flat accent at 10% (no gradient); animation off on first paint beyond a 300ms fade. Bars: radius 4 on top.

### 7.7 Components (`components/ui`, one per file)
`Button` (primary, secondary, ghost, danger; sizes sm/md; pending state with in-button spinner), `IconButton`, `Input`, `PasswordInput`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `Segmented`, `Tabs` (underline style with counts), `Badge`, `StatusPill`, `Avatar` (initials), `Card` (+ `CardHeader`), `Stat`, `Delta`, `Dialog`, `Sheet` (right drawer on desktop, bottom sheet on mobile), `DropdownMenu`, `Popover`, `Tooltip`, `Toast` (sonner), `Skeleton`, `EmptyState`, `Alert` (inline), `DataTable` (TanStack Table: sticky header, sort, row selection, column visibility, responsive card mode), `Pagination`, `DateRangePicker` (presets: Today, Yesterday, 7D, 30D, custom), `ImageUploader` (drag and drop, multi, reorder, progress), `ConfirmDialog`, `Kbd`.

---

## 8. App Shell & Responsive Behavior

### 8.1 Breakpoints
Mobile `< 768` · Tablet `768–1023` · Desktop `>= 1024` · Wide `>= 1440` (content max-width 1440, centered).

### 8.2 Desktop shell (>= 1024)
```
+--------------+----------------------------------------------------------+
| jhatpat      |  Dashboard                [ Search... Cmd+K ]  (bell) (AT) |
| ADMIN        +----------------------------------------------------------+
|              |                                                          |
| Overview     |   Page content (scrolls independently of the sidebar)    |
|  Dashboard   |                                                          |
| Sales        |                                                          |
|  Orders  (3) |                                                          |
|  Payments    |                                                          |
|  Customers   |                                                          |
| Catalog      |                                                          |
|  Products    |                                                          |
|  Categories  |                                                          |
| Marketing    |                                                          |
|  Coupons     |                                                          |
|  Banners     |                                                          |
| Insights     |                                                          |
|  Analytics   |                                                          |
| System       |                                                          |
|  Team        |                                                          |
|  Activity    |                                                          |
|  Settings    |                                                          |
|--------------|                                                          |
| (o) Store open                                                          |
| (AT) Amit T.  Owner                                                     |
+--------------+----------------------------------------------------------+
```
**Sidebar** (translucent `--sidebar`, right hairline border): 248px wide, collapsible to a 64px icon rail (toggle button at the top; state persisted in the UI store). Header: wordmark and a small "Admin" label. Nav is grouped with 11px muted section labels (Overview, Sales, Catalog, Marketing, Insights, System). Item: 32px, icon 16px + label, radius 6, hover `--surface-2`, **active = `--accent-soft` background with accent text and icon**. Count badges (neutral pill; `info` for new orders) from `/admin/counts`. Items the role cannot access are not rendered. Items for routes not built yet are hidden through an `enabled` flag in the nav config. Footer: store status switch ("Store open" with green dot; Owner and Manager can toggle, others see it read-only), then the user row (initials avatar, name, role) opening a menu: Account, Theme (System/Light/Dark), Sign out.

**Topbar** (56px, `--canvas` with bottom hairline, sticky): page title or breadcrumb on the left; a search trigger button (looks like an input, shows `Cmd K`) opening the command palette; notification bell (popover: new orders with ages, low stock count, pending approvals for owner; badge from `/counts`); avatar menu on the far right.

### 8.3 Tablet (768–1023)
Sidebar auto-collapses to the icon rail (tooltips on hover); labels appear as a temporary overlay on expand. Grids drop one column. Tables keep columns but hide low-priority ones.

### 8.4 Mobile (< 768)
- Topbar 52px: title, search icon (opens palette as full-screen), bell.
- **Bottom tab bar** (translucent, hairline top border, safe-area padding): Dashboard, Orders, Products, Customers, **More**. "More" opens a bottom sheet with the remaining grouped nav, theme, and sign out.
- Tables become stacked **card rows** (primary line, secondary line, status pill on the right). Filters open in a bottom sheet with an "Apply" button and active-filter chips above the list.
- Dialogs become bottom sheets. Forms are single column with a sticky bottom action bar (above the tab bar, which hides on form pages).
- Order status actions use a large sticky bottom button. No horizontal page scroll anywhere; wide content scrolls inside its own container.

### 8.5 Page pattern
Every page: **PageHeader** (title, optional one-line description, primary action on the right) then a **Toolbar** (search, filter chips, date range) then content. Every list: loading skeleton matching the final layout, empty state with a clear next action, error state with Retry. Every form: inline validation, pending state, dirty-state guard when leaving with unsaved changes.

### 8.6 Global behaviors
- **Command palette** (`Cmd/Ctrl+K`, or `/` outside inputs): pages, live search (`/admin/search`), quick actions (New product, New coupon, New banner). Arrow keys, Enter, Esc.
- **New order alert:** when `/counts.newOrders` increases: toast "New order" with a link, optional chime (Web Audio, toggle in Account, stored in localStorage), and the browser tab title prefixed with the count, e.g. `(3) Orders | Jhatpat Admin`.
- Session expiry: any 401 clears the query cache and redirects to `/login?next=...`.

---

## 9. Screens

### 9.1 Login `/login`
- Centered card on `--canvas`: width 400, radius 14, border, padding 32, no shadow. No illustration, no gradient.
- Top: "jhatpat" wordmark (Fraunces, deep green) with "Admin" caption beneath. Title "Sign in", one muted line "Use your admin account to continue."
- Fields: Email, Password (show/hide toggle), checkbox "Keep me signed in for 30 days", full-width primary **Sign in**. Link below: "Create an account".
- Validation: email format, password required. Form-level `Alert` for `INVALID_CREDENTIALS`, `ACCOUNT_PENDING` ("Your account is waiting for approval by an owner."), `ACCOUNT_SUSPENDED`, rate limit ("Too many attempts, try again in N minutes"). Enter submits; button disabled while pending; first field autofocused.
- If `setup-status.needsSetup`, show an info alert "No admin exists yet" with a **Create owner account** button instead of the sign-in form.
- Honors `?next=` after success. Already signed in: redirect to `/dashboard`.

### 9.2 Register `/register`
- Same card shell. Fields: Full name, Email, Password with a live requirements checklist (10+ characters, a letter, a number; each turns green with a check when met), Confirm password.
- Normal mode: button **Request access**. On success show an in-card confirmation: outlined check icon, "Request sent", "An owner has to approve your account before you can sign in.", button **Back to sign in**.
- Setup mode (`needsSetup`): title "Create the owner account", helper "This account will manage the whole store.", button **Create owner account**, then sign in automatically and go to `/dashboard`.
- Email already registered: inline field error. Do not reveal whether it is pending or active.

### 9.3 Forced password change `/change-password`
Same card shell. Shown when `mustChangePassword`. Fields: current (temporary) password, new password with the checklist, confirm. Blocks all other routes until done.

### 9.4 Dashboard `/dashboard`
Data: `GET /admin/dashboard?range=`. Range control is a `Segmented` (Today, 7D, 30D, 90D) in the PageHeader, persisted in the URL (`?range=`). Header also shows "Updated 12s ago" with a refresh icon button. Auto-refetch every 30s while visible.

**Desktop grid (12 columns, 16px gaps):**
1. **KPI row**, 4 tiles (3 columns each): Revenue, Orders, Average order value, New customers. Each tile: label (12px muted), value (28px, tabular), a `Delta` line ("+12.4% vs yesterday": text only, success or danger color, arrow icon, no pill background), and a 40px-high sparkline in accent. No icon circles.
2. **Operations strip**, one card, 4 inline stats divided by hairlines: Avg delivery time (`min`), Cancellation rate (%), Active orders, Low stock items. Each links to its filtered list.
3. **Left, 8 columns:**
   - **Revenue** card: `Segmented` Revenue | Orders, area/line chart, 320px high, tooltip with the bucket label and value.
   - **Recent orders** card: 8 rows (order code, customer, items, total, payment pill, status pill, relative time), "View all" link.
4. **Right, 4 columns:**
   - **Needs attention** card (the live queue): new orders oldest first. Each row: code, customer, item count, total, **age timer** that turns amber after 5 min and red after 10 min (quick-commerce SLA), and a small primary **Start preparing** button that performs the status change in place (optimistic, rolls back on error). Empty state: "No orders waiting".
   - **Order status** card: one stacked horizontal bar plus a legend list (status pill, count, percent). No donut.
   - **Low stock** card: product thumb, name, stock count in `warning`/`danger`, and an inline **Restock** popover (number input, Enter saves via `/products/:id/quick`).
5. **Bottom row**, 2 columns: **Top products** (rank, thumb, name, units, revenue) and **Payment methods** (horizontal bars with orders and revenue per method).

**Tablet:** KPIs 2x2; the grid collapses to 1 column below 1024 except the status and low-stock cards, which sit side by side.
**Mobile order:** KPIs 2x2, operations strip (horizontal scroll chips), Needs attention, Revenue chart, Order status, Recent orders (cards), Low stock, Top products, Payment methods.
Empty database: charts show an empty state ("No orders in this period") and KPIs show 0 with no delta. Skeletons match each card's final size.

### 9.5 Orders `/orders`
- Tabs with live counts: All, New, Preparing, Out for delivery, Delivered, Cancelled.
- Toolbar: search (order code, customer name, mobile), payment status filter, method filter, `DateRangePicker`, Export CSV (Manager+).
- Columns: Order (code in tabular mono + relative time), Customer (name, mobile), Items, Total, Payment (method + `StatusPill`), Status (`StatusPill`), Placed (IST date and time), and a row **primary action** button for the next legal status (e.g. "Start preparing"). Row click opens detail. Bulk: none in v1.
- Polling every 20s; newly arrived rows get a 3s `--accent-soft` highlight. Sort by placed time desc by default.
- Mobile: card rows, status pill on the right, tap opens detail.

### 9.6 Order detail `/orders/[code]`
- Header: back, code, status pill, placed time. Actions: primary next-status button; overflow menu: Cancel order (opens dialog with required reason select plus note), Print slip, Copy link. Sticky bottom bar on mobile.
- Two columns on desktop, one on mobile.
  - **Main:** Timeline card (Placed, Preparing, Out for delivery, Delivered with IST time and elapsed minutes between steps; cancelled shows reason and time). Items card (thumb, name, unit, qty, price, line total, struck MRP). Price summary (Total MRP, Product discount, Coupon with code, Delivery, **Total**).
  - **Side:** Customer (name, tap-to-call mobile, link to profile, order count), Delivery address (copy button, "Open in Maps" link built from the address text), Delivery (rider name, rider phone, ETA; editable inline, required before Out for delivery), Payment (method, status pill, Razorpay ids, refunded amount; **Mark COD paid** and **Refund** buttons for Manager+), Internal note (autosaves on blur), Activity (audit entries for this order).
- `/orders/[code]/print`: 80mm-friendly packing slip, `@media print`, auto-opens the print dialog.
- 409 on status change shows a toast "Order was updated by someone else" and refetches.

### 9.7 Products `/products`
- Tabs: All, Active, Inactive, Low stock, Out of stock (with counts). Toolbar: search (debounced 300ms), category filter, sort, column visibility, primary **New product**, Export CSV.
- Columns: checkbox, Product (48px thumb + name + unit), Category, Price (selling, struck MRP, discount %), Stock (**inline editable**, `warning` when low, `danger` at 0), Status (`Switch`, optimistic), Updated, row menu (Edit, Duplicate, View on store, Deactivate, Delete).
- Selecting rows shows a floating bulk bar: Activate, Deactivate, Change category, Clear.
- Staff sees the list with inline stock edit only.
- Mobile: card rows with thumb, price, and a stock stepper.

### 9.8 Product form `/products/new`, `/products/[id]`
Two columns on desktop (main 2/3, side 1/3), one on mobile; sticky action bar with **Discard** and **Save changes**; dirty-state guard.
- **Main:** Basic (name, subtitle, description with character counters) · **Images** (`ImageUploader`: drag-drop zone, multi upload with per-file progress, drag to reorder, first image labelled "Primary", remove button, up to 8, 5 MB each) · Pricing (MRP, Selling price in rupees; read-only "Discount 20%" and "Customer saves ₹X"; error when price > MRP) · Inventory (stock, unit with common presets like 250 g, 500 g, 1 kg, 1 L, 6 pcs).
- **Side:** Status (Active switch with helper text), Organization (category select grouped by parent, tag select: none, Organic, Fresh), URL slug (auto from name on create, editable, with the storefront path preview).
- After save: toast with "View on store" action.

### 9.9 Categories `/categories`
Two-level tree list: parents with expandable children, product counts, drag handle to reorder within a level (`@dnd-kit`, saves via `/categories/reorder`), Featured and Active switches, image thumb. Create and edit in a `Sheet` (name, slug, parent select, image upload, featured, active). Delete is disabled with a tooltip explaining why when it has children or products.

### 9.10 Customers `/customers`, `/customers/[id]`
List: search (name, mobile), blocked filter, sort. Columns: Customer (initials avatar, name, mobile, email), Orders, Lifetime spend, Last order, Joined, status chip when blocked. Detail: header with Block/Unblock; four `Stat` tiles (Orders, Lifetime spend, AOV, Wallet balance); tabs **Orders** (table), **Addresses**, **Wallet** (transactions list with an "Adjust balance" dialog: amount, credit or debit, required reason; Manager+).

### 9.11 Payments `/payments`
Summary strip for the selected range: Collected, COD to collect, Failed, Refunded. Tabs: All, Online, COD, **Refund due**. Table: Order, Customer, Method, Amount, Status pill, Razorpay payment id (copy), Date. Row actions: Mark COD paid, Refund (dialog with amount, defaults to the remaining balance; shows `PAYMENTS_NOT_CONFIGURED` as an inline alert when keys are missing).

### 9.12 Coupons `/coupons`
Table: code (mono), title, readable rule ("20% off, up to ₹150", "₹100 off above ₹499", "Free delivery above ₹299"), validity window with an Expired or Scheduled chip, Used count, Active switch. Create/edit in a `Sheet`; fields change by type; a live "customer sees" preview line (title and subtitle). Delete only when unused.

### 9.13 Banners `/banners`
Tabs: Home, Offers, Category. Card grid with a 16:9 image preview, title, subtitle, link, drag handle, Active switch. Form in a `Sheet`: image upload with recommended size hint, title (60), subtitle (120), CTA label, link, placement or category.

### 9.14 Analytics `/analytics`
Range picker with groupBy. Panels: revenue and orders trend; **orders by hour of day** (IST bar chart, reveals peak hours); sales by category (horizontal bars); top 10 products table; new vs returning customers (stacked bars per period); cancellation reasons list. Export CSV per panel.

### 9.15 Team `/team` (Owner)
Pending approvals pinned on top with **Approve** (choose a role) and **Reject**. Table: name, email, role (inline select), status chip, last login. Row menu: Suspend/Activate, Reset password (dialog shows the temporary password once with a Copy button). Guards from §3 shown as disabled controls with a tooltip.

### 9.16 Settings `/settings` (Owner)
Tabs, each saved independently with a dirty guard: **Store** (name, phone, address, Open/Closed), **Delivery** (delivery fee, free delivery above, minimum order, ETA minutes), **Inventory** (low-stock threshold). Money fields in rupees.

### 9.17 Activity `/activity`
Table: time (IST), admin, action in plain words ("Changed order JP785421 to Preparing"), entity link, expandable `meta` JSON. Filters: entity, admin, date range.

### 9.18 Account `/account`
Profile (name; email read-only), Change password, Appearance (System/Light/Dark), New-order sound toggle, Sign out.

### 9.19 System pages
`not-found`, `error` boundary (message plus Retry plus request id when available), and a 403 state ("You do not have access to this page") for role-blocked routes reached by URL.

---

## 10. Folder Structure

```
apps/admin/
├─ next.config.ts                  # rewrites: /api/* and /uploads/* -> API_ORIGIN
├─ .env.example                    # API_ORIGIN=http://localhost:4000
└─ src/
   ├─ app/
   │  ├─ layout.tsx                # fonts, providers (Query, Theme, Toaster)
   │  ├─ (auth)/                   # login, register, change-password + card layout
   │  ├─ (app)/                    # layout.tsx = AuthGate + AppShell
   │  │  ├─ dashboard/ orders/ [code]/ print/  products/ new/ [id]/
   │  │  ├─ categories/ customers/ [id]/ payments/ coupons/ banners/
   │  │  ├─ analytics/ team/ activity/ settings/ account/
   │  ├─ not-found.tsx · error.tsx
   ├─ components/
   │  ├─ ui/                       # primitives from §7.7
   │  ├─ layout/                   # AppShell, Sidebar, Topbar, MobileTabBar, PageHeader, CommandPalette, Notifications
   │  └─ features/                 # auth/ dashboard/ orders/ products/ categories/ customers/ payments/ coupons/ banners/ analytics/ team/ settings/
   ├─ hooks/                       # use-admin, use-counts, use-debounce, use-unsaved-guard
   ├─ lib/                         # api.ts (fetch wrapper, envelope, 401 handling), format.ts, nav.ts (nav config + roles + enabled), constants.ts
   ├─ store/                       # ui-store.ts (sidebar collapsed, theme, sound)
   ├─ types/
   └─ styles/globals.css           # tokens from §7.2

apps/api/src/
├─ middlewares/admin-auth.ts       # requireAdmin, requireRole, originGuard
├─ utils/ admin-session.ts · audit.ts · ist.ts · slug.ts · pagination.ts · save-image.ts
├─ modules/admin/
│  ├─ routes.ts                    # composes sub-routers behind originGuard + requireAdmin
│  └─ auth/ dashboard/ orders/ products/ categories/ banners/ coupons/ customers/
│     payments/ team/ settings/ activity/ uploads/ analytics/ search/   # each: routes, controller, service, schema .ts
└─ (server.ts mounts: app.use('/api/v1/admin', adminRouter) and static '/uploads')

apps/api/uploads/                  # gitignored
```

---

## 11. Shared Package Additions (`packages/shared/src/admin/`)

One source of truth for both apps:
- Zod schemas: `loginSchema`, `registerSchema` (password policy), `changePasswordSchema`, `productSchema`, `categorySchema`, `bannerSchema`, `couponSchema`, `settingsSchema`, `walletAdjustSchema`, `orderStatusSchema`, `paginationSchema`.
- `ORDER_TRANSITIONS` map (§5), `nextStatusAction(status)` (label for the primary button: "Start preparing", "Out for delivery", "Mark delivered").
- Status metadata: `ORDER_STATUS_META` and `PAYMENT_STATUS_META` (label + tone: `neutral | info | warning | indigo | success | danger`) so `StatusPill` and the API never drift.
- Types for every response shape, including `DashboardResponse`.

---

## 12. Security Checklist

- Passwords hashed with bcryptjs (cost 12); generic login error; lockout and rate limits from §5; constant-time compare via bcrypt.
- Cookie flags per §2; `aud: "admin"` verified on every request, so customer tokens can never open admin routes.
- `requireAdmin` re-reads the admin row each request; role checks in the API, not just the UI.
- Origin guard on every non-GET admin request; reject unexpected content types.
- Every input validated by Zod; Prisma only (no string-built SQL). `$queryRaw` uses tagged templates with parameters.
- Upload hardening: size cap, magic-byte type check, `sharp` re-encode (strips EXIF and any embedded payload), random file names, never trust the client file name or extension.
- Blocked customers (`isBlocked`) are rejected at storefront login and checkout (Phase 7).
- Reset-password temporary values are shown once and never logged; `meta` in `ActivityLog` must never contain passwords or tokens.
- Helmet and the existing CORS setup stay; the admin origin is not added to CORS (it uses the proxy).
- `database/jhatpat.sql` contains real customer contact details: keep it out of any public repository.

---

## 13. Performance & UX Rules

- Dashboard in a single request, cached 15s server-side; TanStack Query `staleTime` 15s for dashboard, 20s for counts, 60s for lists.
- Skeletons sized to the final layout (zero layout shift); no page-level spinners.
- Tables paginate server-side; debounce search 300ms; keep previous data while paging (`placeholderData`).
- Charts and the command palette are dynamically imported; keep the shell bundle small.
- Optimistic updates: status change from the queue, product active toggle, inline stock edit, reorder. Roll back with a toast on error.
- Buttons disable and show pending while submitting (no double submits). Every list handles loading, empty and error.
- Accessibility: semantic landmarks (`nav`, `main`), labels on all inputs, `aria-current` on active nav, focus trap in dialogs (Radix), 4.5:1 contrast, full keyboard operation, `aria-live` for toasts.

---

## 14. Build Phases

Each phase ends with working, reviewable output. Stop after each one.

### Phase 1: Foundation, Auth, Shell (first visible milestone)
1. Prisma changes from §4 and the migration. Add `ADMIN_ORIGINS` to env. Install `multer` and `sharp` later (Phase 4), not now.
2. API: `admin-session`, `admin-auth` middlewares, `audit()`, `ist.ts`, admin auth module (all six endpoints), `GET /admin/counts`, mount `/api/v1/admin`.
3. `apps/admin` scaffold, `next.config.ts` proxy, `dev:admin` and `dev:all` scripts, tokens, fonts, theme provider, Toaster, Query provider.
4. UI primitives needed so far: Button, Input, PasswordInput, Checkbox, Switch, Alert, Card, Avatar, Badge, Tooltip, DropdownMenu, Dialog, Sheet, Skeleton, EmptyState, Kbd.
5. Layout: `AppShell`, `Sidebar` (grouped nav, collapse, counts, store status), `Topbar`, `MobileTabBar` + More sheet, `PageHeader`, `AuthGate`, role-aware `nav.ts`. Only Dashboard enabled in nav; empty `/dashboard` page shows the `PageHeader` and an `EmptyState`.
6. Screens: Login, Register (incl. owner setup mode and pending confirmation), Change password, Account (profile, password, appearance), 403, not-found, error.

Acceptance: first registration creates the owner and lands on the shell; second registration shows "Request sent" and cannot sign in until approved (approve manually via DB for now); wrong password shows a generic error; shell renders correctly at 390, 768, 1280 and 1600 px in light and dark; sidebar collapse persists; no console errors.

### Phase 2: Dashboard (real data)
API dashboard module per §6, `GET /admin/search` is **not** needed yet. UI: all widgets from §9.4, `Delta`, `Sparkline`, charts, range control, skeletons, empty states, queue with in-place "Start preparing" (this requires the orders status endpoint: implement the shared transition map and that single endpoint now, the rest of Orders comes in Phase 3).

Acceptance: KPI values match hand-run SQL on the seeded orders (valid-order rule, IST boundaries); previous-period deltas correct; zero-filled series; cancelled and pending-payment orders excluded from revenue; queue timers and colors work; mobile order matches §9.4.

### Phase 3: Orders
Orders module (§5), list, detail, status machine with stock restore on cancel, rider and ETA, internal note, packing slip print, CSV export, polling, new-order toast and tab title count, `counts` badge in sidebar and bell, audit entries.

Acceptance: illegal transitions rejected by the API; two admins changing the same order gives a clean 409; cancelling restores stock; COD delivered becomes paid.

### Phase 4: Catalog (uploads, products, categories)
Install `multer` and `sharp`. `save-image.ts`, uploads module and static `/uploads`. Products module and screens (§9.7, §9.8), `ImageUploader`, inline stock and quick edits, bulk actions, categories tree with drag reorder, product CSV export. Also add the `/uploads` rewrite to `apps/web/next.config` so uploaded images show on the storefront.

Acceptance: upload, reorder and remove images; price greater than MRP blocked; slug unique; product with order history cannot be deleted; storefront shows the new product and images.

### Phase 5: Customers & Payments
Customers module, list and detail, block (storefront enforcement in Phase 7), wallet adjustments with ledger. Payments module, summary, refund-due tab, mark COD paid, Razorpay refund.

### Phase 6: Coupons & Banners
Both modules and screens, reorder, live preview, usage counts.

### Phase 7: Team, Settings, Activity, Storefront integration
Team module (approve, roles, suspend, reset password), settings, activity log, global command palette with `/admin/search`. Storefront: add `GET /api/v1/store`; replace hardcoded delivery fee and free threshold with `StoreSetting`; reject checkout with `STORE_CLOSED` when `isOpen` is false and show a banner in the web app; enforce `isBlocked`.

### Phase 8: Analytics & imports
Analytics module and screen (§9.14), CSV exports for each panel, product CSV import (validate, preview, then commit in one transaction).

### Phase 9: Polish & hardening
Accessibility and keyboard pass, empty/error state audit across all screens, performance pass (bundle, query keys, indexes via `EXPLAIN` on dashboard and orders queries), copy review, responsive review at 390 / 768 / 1280 / 1600. **Only then** wait for the owner to say "start testing".

---

## 15. Definition of Done (per phase)

Matches §7 tokens and §8 layout · responsive at 390 / 768 / 1280 · light and dark · loading, empty and error states · optimistic where specified · role rules enforced in the API · audit entries for every mutation · Zod validation on every input · typed end to end, no `any` · no console logs · no unused code or placeholder files · conventional commits only when asked.

---

## 16. Open Decisions (defaults apply until the owner answers)

| Item | Default |
|---|---|
| Delivery fee and free-delivery threshold | Copied from current checkout constants; editable in Settings |
| Image storage in production | Local disk now; S3 or Cloudflare R2 behind `saveImage()` before go-live |
| Admin password recovery | Owner resets from Team (no email provider in v1) |
| Refunds | Razorpay refund API when keys exist; otherwise disabled with an explanatory alert |
| GST invoice | Out of scope; packing slip only |
| New-order alert sound | Off by default, toggle in Account |
