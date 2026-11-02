# PRD — Jhatpat (Grocery Delivery, Mobile-First)

Reference: `docs/design/45c5b1e06d38b3303ecda3daad62479a.png` — Welcome (center), Home (left), Category Listing (right). Build those three exactly as shown; all other screens follow the same visual language. Brand is **Jhatpat** everywhere (the reference's brand name/logo is not used).

## 1. Product
Same-day grocery delivery app for a **single store** (no multi-vendor, no store picker): one catalog of categories → subcategories → products. Mobile-first web app (Next.js) backed by a Node.js REST API. Tagline: *Groceries, Delivered in Minutes.*

**Goals:** fast browse → add → checkout in under 60s; instant-feeling UI; zero layout shift.
**Market:** India (₹, +91, UPI-first). Default city: Kota, Rajasthan.

## 2. Design Tokens
| Token | Value (approx., match reference) |
|---|---|
| `--primary` | #3D9A1B green (CTAs, add buttons, active states) · strong #2C7A10 · soft #EDF7E6 |
| `--brand` | #24520F deep green (display headings) |
| `--accent` | #FFCF3F yellow (discount pills, splash, banners) · soft #FFF4CC |
| `--fresh` | #E8743B ("Fresh" tag) · soft #FDEEE4 |
| `--danger` | #E5484D |
| `--canvas` | #FFFCF2 warm cream · surface #FFFFFF |
| `--ink` | #1D2614 · `--muted` #6D7262 · border #ECEBE0 |
| Fonts | Display: Fraunces (headings, product names, prices) · Body: Plus Jakarta Sans |
| Radius | cards 16–20px · chips/tiles 12px · CTAs pill |
| Shadow | soft, warm, low-opacity |

Logo: lowercase "jhatpat" wordmark in the display font, deep green.

## 3. Navigation
- **Bottom tab bar** (Home, Categories, Offers, Orders, Account): active tab is a filled green circle with white icon + label; others muted icon + label.
- **Category Listing** has no tab bar; it shows a floating cart bar when the cart has items.
- **Header (Home):** "Deliver to" + address ▾, "{ETA} Minutes" display heading, "Express Delivery" + "On-time Guarantee", hero bag image on the right.
- **Header (inner pages):** square back button, location pill (pin + city ▾) center, cart icon (badge) right.

## 4. Screens & Requirements

### 4.0 Welcome (`/welcome`)
- Shown once on first visit (cookie), then `/`.
- Yellow gradient background. Top-left glass pill: bolt icon, "10-Min Delivery", "Freshness, Delivered."
- Centered wordmark, "Groceries, **Delivered** in Minutes." (accent word in green).
- Grocery hero image bottom; glass card "Trusted by Thousands · Kota's Most Trusted Delivery App" with shield icon; 3-dot pager; "Get Started" CTA.

### 4.1 Login (`/login`)
- Not in the reference; same visual language. Mobile (+91) + password, show/hide toggle, "Forgot Password?", **Login** CTA, Google / WhatsApp, "Sign Up" link.
- Validation: 10-digit Indian mobile, password min 8. Inline errors. Button pending state.

### 4.2 Home (`/`)
1. Header (see §3).
2. Search bar ("Search for vegetables, groceries & more") with green mic button (voice search where supported) → submits to Category Listing with `q`.
3. Category row: "All" + top-level categories as square image tiles; selected tile green-tinted with green border.
4. Banner carousel: cream/yellow card, display title, subtitle, "Shop Now →" pill, image right, dot pager.
5. **Deals** section (title from config, e.g. "Festive Specials", "See all →"): horizontal product cards — yellow "% OFF" pill, image, name, unit, price, struck MRP, green round **+**.
6. **Best Sellers** ("See all →"): featured subcategory tiles (image + 2-line label).
- **+** turns into qty stepper after first add (optimistic).

### 4.2a Category Listing (`/categories`, `/categories/[slug]`)
- Header (inner). Left rail: "All" + subcategories (image + label), active item green-tinted. On `/categories` the rail lists top-level categories.
- Category hero banner: display title ("Eat Fresh, Stay Healthy."), subtitle, "Shop Now →", image.
- Search field (debounced 300ms) with green filter button → Filter sheet.
- Chips: Filter · Sort by ▾ (Popular, Price low–high, Price high–low, Rating) · Organic · Best Rated (≥4.5).
- 2-column product grid: tag pill (Organic green / Fresh orange), wishlist heart, image, name, ★ rating (count), subtitle, price + struck MRP, green **+**. Infinite scroll.
- Floating cart bar: thumbnail + count badge, "n Items in Cart", "View Cart", green total pill "₹X →".

### 4.3 Product Detail (`/product/[slug]`)
- Header: back, logo, search, wishlist heart, cart (badge).
- Gallery: large image with discount badge (e.g. "20% OFF") + expand icon; vertical thumbnail rail (3), active thumb outlined.
- Title, unit with approx. info ("1 kg (Approx. 5–7 pcs)"), rating ★ + review count, tag pill ("Fresh & Organic").
- Price block: selling price, struck MRP, % OFF pill, "You save ₹X (Y%)" in green. Qty stepper on the right.
- 4 feature tiles: Farm Fresh · No Chemicals · Same Day Delivery · Best Price.
- Collapsible **Product Description**.
- **Related Products** — horizontal cards with Add +. "See All →".
- Sticky bottom bar: **Add to Wishlist** (outline) | **Add to Cart** (primary).

### 4.4 Cart (`/cart`)
- Title "My Cart (n items)" + **Clear Cart** (danger outline, confirm before clearing).
- Line item card: image, name, unit, tag badge, price + struck MRP, remove (✕), qty stepper (min 1; at 1, "–" does not remove; ✕ removes).
- **Apply Promo Code** row → opens coupon bottom sheet (input + available coupons list).
- **Price Details:** Total MRP · Discount on Products (green, negative) · Delivery Charge (ⓘ tooltip; free shows ₹0 with struck original) · **Total Amount** · "You save ₹X on this order".
- Primary CTA **Proceed to Checkout →** (sticky above tab bar on small screens if content scrolls).
- Empty state: illustration, "Your cart is empty", Shop Now.

### 4.5 Checkout / Payment (`/checkout`)
- Stepper: Cart ✓ → **Payment** → Order Placed.
- **Order Summary (n items):** thumbnail strip, "View Items ›", total amount (ⓘ), savings line.
- **Apply Coupon Code** row (shared coupon sheet).
- **Select Payment Method** (single-select, accordion):
  - **UPI** (Recommended badge, expanded by default): PhonePe, Google Pay, Paytm, Amazon Pay, Other UPI (selected tile has primary border + check).
  - Credit / Debit Card (Visa, MasterCard, Rupay)
  - Net Banking
  - Wallet (Paytm, Amazon Pay, Mobikwik)
  - Cash on Delivery (badge "₹0 Extra Charge")
- Trust strip: "100% Secure Payment" + PCI DSS lock.
- Sticky footer: total + "View Details ▾" (opens price breakdown sheet) + **Pay Now →**.
- Online methods → Razorpay. COD → create order directly. Success → `/order/[id]/success`.

## 5. Data Model (MySQL / Prisma)
`User` (id, name, mobile unique, email?, passwordHash, googleId?, createdAt)
`Address` (id, userId, label, line1, line2, city, state, pincode, lat?, lng?, isDefault)
`Category` (id, parentId?, name, slug, image, featured, sortOrder, isActive) — two levels: category → subcategory
`Product` (id, categoryId, name, slug, unit, subtitle, description, tag, ratingAvg, ratingCount, mrpPaise, pricePaise, stock, isActive)
`ProductImage` (id, productId, url, sortOrder)
`Banner` (id, categoryId?, title, subtitle, ctaLabel, image, link, sortOrder, isActive) — categoryId null = Home carousel
`Cart` (id, userId unique) · `CartItem` (cartId, productId, qty) unique(cartId, productId)
`Wishlist` (userId, productId)
`Coupon` (id, code, type[flat|percent], value, minOrderPaise, maxDiscountPaise?, validFrom, validTo, isActive)
`Order` (id, userId, addressId, status, paymentMethod, paymentStatus, subtotalPaise, discountPaise, couponPaise, deliveryPaise, totalPaise, razorpayOrderId?, createdAt)
`OrderItem` (orderId, productId, name, unit, qty, pricePaise, mrpPaise) — snapshot values.
Indexes: `Product(slug)`, `Product(categoryId, isActive)`, `Order(userId, createdAt)`.

## 6. API (`/api/v1`)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `/auth/login` · `/auth/logout` · `/auth/google` · `/auth/whatsapp` · `/auth/forgot-password` · `GET /auth/me` |
| Catalog | `GET /home` (banners + categories + deals + best sellers in one call) · `GET /categories` · `GET /categories/:slug` (subcategories + banner) · `GET /products?category=&q=&sort=&tag=&minRating=&cursor=` · `GET /products/:slug` (includes related) |
| Cart | `GET /cart` · `POST /cart/items` · `PATCH /cart/items/:productId` · `DELETE /cart/items/:productId` · `DELETE /cart` · `POST /cart/coupon` · `DELETE /cart/coupon` |
| Wishlist | `GET /wishlist` · `POST /wishlist/:productId` · `DELETE /wishlist/:productId` |
| Orders | `POST /orders` · `GET /orders?tab=ongoing\|past` · `GET /orders/:id` |
| Offers | `GET /offers` (offer banners + active coupons) |
| Account | `GET /account/summary` (profile, wallet, address and order counts) |
| Payments | `POST /payments/razorpay/order` · `POST /payments/razorpay/verify` · `POST /payments/razorpay/webhook` |
| Misc | `GET /coupons` · `GET/POST/PATCH/DELETE /addresses` |

**Rules:** Server computes all totals (MRP, discount, coupon, delivery) from DB prices — never from client. Delivery fee: ₹0 above free-delivery threshold (configurable, default ₹199 pending owner confirmation), else flat fee. Stock checked at order creation. Payment status confirmed only via verified signature/webhook.

## 7. Non-Functional
- LCP < 2.5s on 4G; CLS ≈ 0; interactions respond < 100ms (optimistic UI).
- Skeletons on every async view; empty and error states everywhere.
- API p95 < 300ms on catalog reads; cache `GET /home` and categories (short TTL).
- Security per `CLAUDE.md`. Rate-limit auth and payment routes.
- Accessibility: WCAG AA basics.

## 8. Build Order
1. Monorepo setup, tokens, UI primitives (Button, Input, Badge, Skeleton, QtyStepper, Sheet), layout shell (Header, BottomNav).
2. API foundation: config, Prisma schema, error/validation middleware, auth module.
3. Auth screen + session.
4. Catalog API + Home screen.
5. Product detail.
6. Cart API + Cart screen (optimistic) + coupon sheet.
7. Orders + Razorpay + Checkout screen + success screen.
8. Seed data, polish, performance pass.
9. **Testing phase (only after owner approval).**

## 9. Out of Scope (v1)
Admin panel, live order tracking, ratings submission, multi-language, push notifications. Bell icon and Offers/Orders/Account tabs render basic functional pages only.

## 10. Open Decisions
- Free-delivery threshold and fee: default above, owner to confirm.
- Screenshot totals are mock (line items sum to ₹353, not ₹342 shown); use real computed values.
- WhatsApp login: OTP via WhatsApp Business API (provider TBD).
