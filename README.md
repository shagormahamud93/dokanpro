# 🛒 DokanPro POS SaaS System

A multi-tenant POS (Point of Sale) SaaS system built for Bangladesh local shops with manual subscription billing (bKash/Nagad based).

---

# 🚀 Features

## 🏪 POS System
- Product management
- Stock management
- Order system
- Real-time updates

## 💳 Subscription System (Bangladesh Friendly)
- Manual bKash / Nagad payment support
- Transaction ID submission
- Admin verification system
- Subscription activation/deactivation
- Auto expiry system (30 days default)

## 🔐 Authentication
- JWT-based login system
- Role-based access (Admin / Shop Owner)
- Protected routes

## 🧑‍💼 Admin Panel
- View subscription requests
- Approve / Reject payments
- Manage shop subscriptions
- Extend subscription manually

## ⚡ Real-time Features
- Stock update in real-time
- Order updates via Socket.IO

---

# 🏗️ Tech Stack

### Backend:
- Node.js (≥ 18)
- Express.js
- MongoDB (Mongoose)
- JWT Authentication (`jsonwebtoken` + `bcryptjs`)
- Socket.IO

### Frontend:
- React (Vite + TypeScript)
- Tailwind CSS
- Native `fetch` API client
- React Router
- Recharts (analytics)
- `socket.io-client`

---

# 📁 Project Structure

```
dokanpro/
├── backend/                          # Node + Express + MongoDB API
│   ├── src/
│   │   ├── config/                   # env validation, DB connection
│   │   ├── middlewares/              # auth, subscription gate, error handler
│   │   ├── modules/
│   │   │   ├── auth/                 # JWT login + /me
│   │   │   ├── users/                # User model + admin CRUD
│   │   │   ├── shops/                # Shop tenant model
│   │   │   ├── products/             # Product model + CRUD
│   │   │   ├── orders/               # POS sales w/ atomic stock decrement
│   │   │   ├── customers/            # Customer CRUD
│   │   │   └── subscriptions/        # plans, submit, admin approve/reject
│   │   ├── jobs/expirySweep.js       # Hourly auto-expiry sweep
│   │   ├── sockets/                  # Socket.IO w/ room scoping
│   │   ├── utils/                    # asyncHandler, ApiError, JWT helpers
│   │   ├── app.js                    # Express factory
│   │   └── server.js                 # HTTP + Socket.IO + graceful shutdown
│   ├── scripts/seed.js               # Demo data seeder
│   ├── .env.example
│   └── package.json
│
├── src/                              # React + Vite + Tailwind frontend
│   ├── components/
│   │   ├── ui/                       # Button, Card, Input, Modal, Toast, Badge…
│   │   ├── layout/                   # Sidebar, Topbar, AppLayout, ExpiryBanner
│   │   ├── auth/ProtectedRoute.tsx   # JWT route guard
│   │   ├── subscription/             # Guard, banner, badge
│   │   ├── pos/                      # SearchBar, ProductGrid, Cart, PaymentModal
│   │   └── dashboard/                # KPI, charts, transactions
│   ├── context/                      # Theme, Auth, Toast, Socket, Subscription, I18n
│   ├── hooks/                        # useCart, useProducts, useHotkeys, useBarcodeScanner
│   ├── lib/                          # api client, formatters, plan catalog
│   ├── pages/                        # Login, Dashboard, POS, Subscription, AdminSubscriptions, Settings
│   ├── routes/AppRoutes.tsx
│   ├── App.tsx
│   └── main.tsx
│
├── tailwind.config.js                # Design tokens (colors, type, motion)
├── vite.config.ts
├── .env.example                      # VITE_API_URL
└── package.json
```

---

# 🚀 Installation Guide

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** (local install or MongoDB Atlas cluster)
- **Yarn** (preferred) or **npm**
- A free **bKash** / **Nagad** merchant number for receiving payments (use placeholders for development)

### Step 1 — Clone the repository

```bash
git clone <your-repo-url> dokanpro
cd dokanpro
```

### Step 2 — Backend setup

```bash
cd backend
yarn install                    # or: npm install
cp .env.example .env            # then edit .env (see "Environment Variables" below)
yarn seed                       # creates demo admin, demo shop, sample products + 30-day active subscription
```

### Step 3 — Frontend setup

```bash
cd ..                           # back to project root
yarn install
cp .env.example .env            # set VITE_API_URL=http://localhost:4000
```

> **Tip — special characters in MongoDB password:** if your password contains `@`, `!`, `&`, `$`, `#`, `:`, `/`, or `?`, URL-encode them in `MONGODB_URI`. For Atlas, use the "Show password" option in the Connect dialog — it provides an already-encoded value.

---

# ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `NODE_ENV` | – | `development` | `development` or `production`. Controls error verbosity + request logging. |
| `PORT` | – | `4000` | TCP port the API listens on. |
| `MONGODB_URI` | ✅ | – | Full MongoDB connection string. Use `mongodb://...` for local, `mongodb+srv://...` for Atlas. |
| `JWT_SECRET` | ✅ | – | Secret used to sign JWT access tokens. **Use ≥ 32 random characters.** |
| `JWT_EXPIRES_IN` | – | `7d` | Access token lifetime (e.g. `15m`, `12h`, `7d`). |
| `CORS_ORIGIN` | – | `*` | Comma-separated list of allowed frontend origins. Example: `http://localhost:5173,https://app.dokanpro.com`. |
| `BCRYPT_ROUNDS` | – | `10` | bcrypt cost factor for password hashing. |
| `BKASH_MERCHANT` | – | `01711-000000` | Number shown to shop owners on the subscription submit form. |
| `NAGAD_MERCHANT` | – | `01811-000000` | Number shown to shop owners on the subscription submit form. |

#### Example backend `.env`

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/dokanpro
JWT_SECRET=please-replace-this-with-at-least-32-random-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
BCRYPT_ROUNDS=10
```

### Frontend (`./.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `VITE_API_URL` | ✅ | `http://localhost:4000` | Base URL the frontend uses for HTTP + Socket.IO. Must match your backend's `PORT` and be present in the backend's `CORS_ORIGIN`. |

#### Example frontend `.env`

```env
VITE_API_URL=http://localhost:4000
```

---

# ▶️ How to Run Project

You'll need **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Backend (port 4000)

```bash
cd backend
yarn dev          # development mode (nodemon, auto-reload)
# or
yarn start        # production mode
```

You should see:

```
[db] connected → cluster0/dokanpro
[http] DokanPro API running on http://localhost:4000
[ws]   Socket.IO listening on  ws://localhost:4000/socket.io
[jobs] Subscription expiry sweep started (hourly)
```

### Terminal 2 — Frontend (port 5173)

```bash
yarn dev          # Vite dev server with HMR
# or
yarn build && yarn preview      # production build + preview
```

Then open **http://localhost:5173** in your browser.

### Useful scripts

#### Backend (`backend/`)
| Command | Description |
|---------|-------------|
| `yarn dev` | Development with nodemon auto-reload |
| `yarn start` | Production-style start |
| `yarn seed` | Wipe DB and create demo data |

#### Frontend (project root)
| Command | Description |
|---------|-------------|
| `yarn dev` | Vite dev server |
| `yarn build` | Type-check + production bundle |
| `yarn preview` | Serve production bundle locally |
| `yarn lint` | ESLint |

---

# 🔐 Admin Login Info (Demo)

After running `yarn seed` in the backend, two demo accounts are available:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Platform Admin** | `admin@dokanpro.com` | `admin123` | Full platform access. Verifies subscription payments. **Bypasses subscription gate.** Has no shop. |
| **Shop Staff / Owner** | `staff@dokanpro.com` | `staff123` | Belongs to "Rahim Store". Uses POS, products, customers, orders. Subject to subscription gate. |

The seed also creates an active 30-day subscription for "Rahim Store" so you can use the POS immediately after sign-in.

> **Production note:** delete or rotate these credentials before deploying. The demo admin password is intentionally weak. Use the admin panel to create real users, then deactivate `admin@dokanpro.com`.

### How the two roles differ

- **Admin (`role: 'admin'`)**
  - Sees **Admin → Subscriptions** in the sidebar
  - Approve / Reject / Extend any shop's payment
  - Bypasses the subscription middleware — can always reach all routes
  - Has no `shop` association

- **Staff (`role: 'staff'`)**
  - Sees **Subscription** under System in the sidebar
  - Can only see / modify their own shop's data
  - Blocked from POS / Products / Orders / Customers if subscription is not `active`

---

# 🔄 Full System Flow

End-to-end SaaS lifecycle, from a brand-new shop to active selling:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. SHOP SIGNUP                                                            │
│    Admin creates a shop user via POST /api/users                          │
│    or seed script provisions one.                                         │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. SHOP OWNER LOGS IN                                                     │
│    Receives JWT. Backend returns user + shop reference.                   │
│    No active subscription → frontend redirects to /subscription.          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. SHOP OWNER PAYS EXTERNALLY                                             │
│    Sends ৳999 (monthly) / ৳2499 (quarterly) / ৳8999 (yearly) via          │
│    bKash or Nagad to the merchant number shown on the page.               │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. SHOP OWNER SUBMITS PAYMENT INFO                                        │
│    POST /api/subscriptions { plan, paymentMethod, transactionId,          │
│                              paidAmount, screenshot? }                    │
│    Subscription record created with status = "pending".                   │
│    Socket "subscription:submitted" → admin room.                          │
│    Toast: "Pending Approval"                                              │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. ADMIN VERIFIES MANUALLY                                                │
│    /admin/subscriptions → reviews trxId against bKash/Nagad statement     │
│    → APPROVE  → status = "active", startDate = now,                       │
│                 endDate = now + planDays, shop.currentSubscription = id   │
│    → REJECT   → status = "rejected" + reason                              │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. SHOP RECEIVES REAL-TIME NOTIFICATION                                   │
│    Socket "subscription:approved" → shop room.                            │
│    Toast: "Subscription Active". Frontend refetches state.                │
│    Subscription middleware now passes — full system unlocked.             │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. NORMAL OPERATION                                                       │
│    Shop uses POS, manages products, processes orders.                     │
│    All requests pass requireActiveSubscription middleware.                │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 8. EXPIRY                                                                 │
│    Hourly job (jobs/expirySweep.js) detects endDate < now:                │
│    → status = "expired"                                                   │
│    → shop.currentSubscription = null                                      │
│    → socket "subscription:expired" → shop room                            │
│    Frontend redirects to /subscription on next protected request.         │
│    Owner submits a new payment → loop returns to step 4.                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# ⛔ Access Control Logic

DokanPro layers **three guards** in order on every protected request:

### Layer 1 — `protect` (JWT auth)
- Reads `Authorization: Bearer <token>`
- Verifies signature with `JWT_SECRET`
- Loads the user; rejects if inactive
- **Failure → HTTP 401** (`No token provided` / `Invalid or expired token`)

### Layer 2 — `restrictTo(...roles)` (RBAC)
- Used on admin-only routes (`/api/users`, `/api/admin/subscriptions`)
- Checks `req.user.role` against the allowed list
- **Failure → HTTP 403** (`Requires role: admin`)

### Layer 3 — `requireActiveSubscription` (billing gate)
Applied to: `/api/products`, `/api/orders`, `/api/customers`.

```
┌──────────────────────────────────────────────────────────────┐
│ Is user.role === 'admin'?           → PASS  (platform admin) │
│ Has user.shop?                       → 402 no_shop           │
│ Load shop + currentSubscription                              │
│                                                              │
│ Lazy expiry check:                                           │
│   if status==='active' && endDate < now                      │
│     → flip to 'expired', clear shop.currentSubscription      │
│     → emit socket 'subscription:expired'                     │
│                                                              │
│ Is current subscription active?                              │
│   YES → attach req.shop + req.subscription, PASS             │
│   NO  → 402 subscription_required                            │
└──────────────────────────────────────────────────────────────┘
```

When the API returns **HTTP 402** with `{ error: { details: { code: 'subscription_required' } } }`:

- The frontend `api.ts` intercepts the response
- Dispatches a `subscription:required` window event
- `SubscriptionContext` refetches `/api/subscriptions/me`
- `<SubscriptionGuard>` (wrapping POS / Dashboard / Products / etc.) sees `isActive === false`
- Redirects to `/subscription`

### Access matrix

| Route | Anonymous | Staff (no sub) | Staff (active) | Admin |
|-------|:---------:|:--------------:|:--------------:|:-----:|
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/subscription` | – | ✅ | ✅ | ✅ (sees admin notice) |
| `/settings` | – | ✅ | ✅ | ✅ |
| `/admin/subscriptions` | – | 403 | 403 | ✅ |
| `/`, `/pos`, `/products`, `/orders`, … | – | redirect → `/subscription` | ✅ | ✅ |
| `GET /api/products` | 401 | 402 | 200 | 200 (bypass) |
| `POST /api/orders` | 401 | 402 | 200 | 200 (bypass) |
| `POST /api/subscriptions` | 401 | 200 | 200 | 400 (admins don't need a sub) |
| `POST /api/admin/subscriptions/:id/approve` | 401 | 403 | 403 | 200 |

---

# 🌐 API Reference (Quick Index)

All routes are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Role |
|--------|------|------|
| `POST` | `/auth/login` | public (rate-limited: 20 / 15 min) |
| `GET` | `/auth/me` | any authenticated |

### Users (admin only)
| Method | Path |
|--------|------|
| `GET` | `/users` |
| `POST` | `/users` |
| `GET` `PUT` `DELETE` | `/users/:id` |

### Products (gated)
| Method | Path | Role |
|--------|------|------|
| `GET` | `/products?q=&category=&stock=&page=&limit=` | any (active sub) |
| `GET` | `/products/barcode/:code` | any (active sub) |
| `GET` | `/products/:id` | any (active sub) |
| `POST` `PUT` `DELETE` | `/products[/:id]` | admin |

### Orders (gated)
| Method | Path |
|--------|------|
| `GET` | `/orders?from=&to=&paymentMethod=&status=` |
| `POST` | `/orders` (idempotent via `clientId`, atomic stock decrement) |
| `GET` | `/orders/:id` |

### Customers (gated)
| Method | Path |
|--------|------|
| `GET` `POST` | `/customers` |
| `GET` `PUT` `DELETE` | `/customers/:id` |

### Subscriptions (shop-side)
| Method | Path |
|--------|------|
| `GET` | `/subscriptions/plans` |
| `GET` | `/subscriptions/me` |
| `POST` | `/subscriptions` |

### Subscriptions (admin)
| Method | Path |
|--------|------|
| `GET` | `/admin/subscriptions?status=&q=&page=&limit=` |
| `GET` | `/admin/subscriptions/:id` |
| `POST` | `/admin/subscriptions/:id/approve` |
| `POST` | `/admin/subscriptions/:id/reject` |
| `POST` | `/admin/subscriptions/:id/extend` |

---

# 📡 Real-time Events (Socket.IO)

Connect with the JWT in the handshake:

```ts
import { io } from 'socket.io-client'
const socket = io('http://localhost:4000', { auth: { token } })
```

The server places each socket in three rooms based on the authenticated user:
- `user:{userId}` — direct messages
- `shop:{shopId}` — tenant-wide events (only if user has a shop)
- `admin` — platform-wide notifications (only if `role === 'admin'`)

### Server → Client events

| Event | Room | Payload | Triggered when |
|-------|------|---------|----------------|
| `order:created` | `shop:{id}` | full order | A POS sale completes |
| `stock:updated` | `shop:{id}` | `{ productId, stock, name }` | After every stock change |
| `low-stock:alert` | `shop:{id}` | `{ productId, name, stock }` | Stock crosses reorder point |
| `product:updated` | broadcast | full product | Admin edits a product |
| `subscription:submitted` | `admin` + `shop:{id}` | full subscription | Shop owner submits payment |
| `subscription:approved` | `shop:{id}` | full subscription | Admin approves |
| `subscription:rejected` | `shop:{id}` | full subscription | Admin rejects |
| `subscription:extended` | `shop:{id}` | full subscription | Admin extends days |
| `subscription:expired` | `shop:{id}` | `{ id, endDate }` | Hourly sweep or lazy check flips a sub to expired |

---

# 📦 Testing Steps

A complete walk-through for verifying every system path works after install.

### A. Smoke test — backend up

1. Start backend: `cd backend && yarn dev`
2. In a separate terminal: `curl http://localhost:4000/healthz`
3. Expect: `{"ok":true,"env":"development"}`

### B. Authentication

1. Run seed: `yarn seed`
2. ```bash
   curl -X POST http://localhost:4000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@dokanpro.com","password":"admin123"}'
   ```
3. Expect a JSON body with `data.token` and `data.user.role === 'admin'`.
4. Repeat with `staff@dokanpro.com` / `staff123` — `data.user.shop` should be a non-null ObjectId.

### C. Frontend sign-in

1. Start frontend: `yarn dev` (project root)
2. Open `http://localhost:5173` → land on `/login`
3. Sign in as **admin@dokanpro.com**
4. Verify:
   - Redirected to `/`
   - Top-right shows "Admin" badge (purple/blue)
   - Sidebar has **Admin → Subscriptions**
   - Topbar profile dropdown → Sign out works

### D. POS flow (as staff)

1. Sign out, then sign in as **staff@dokanpro.com**
2. Verify topbar shows **`30 days left`** subscription badge (green)
3. Click **POS Sale** in the sidebar
4. Try each path:
   - Type "rice" → press **Enter** → product added to cart
   - Type a barcode like `8901234567890` → **Enter** → matching product added
   - Use **↑/↓** to select cart items, **+/-** to change quantity
   - Press **F4** to hold the cart, then click **Holds** to recall
5. Press **Enter** (with items in cart) → payment modal opens
6. Pick **Cash (F9)** → enter tendered amount → **Enter** → success screen
7. Verify:
   - Toast: "Order completed"
   - Stock numbers on product tiles decrement in real time (`stock:updated` event)

### E. Subscription submission flow (manual payment)

1. Force-expire the seeded subscription. In Mongo shell:
   ```js
   db.subscriptions.updateOne({}, { $set: { status: 'expired', endDate: new Date(0) } })
   db.shops.updateOne({}, { $set: { currentSubscription: null } })
   ```
2. Reload the staff browser tab → POS now redirects to `/subscription`
3. Staff side:
   - Choose **Monthly** plan
   - Choose **bKash** as payment method (note the merchant number is shown)
   - Enter any test transaction ID, e.g. `TEST123ABC`
   - Enter `999` as paid amount
   - Submit → Toast: "Payment submitted, Awaiting admin verification"
   - Page now shows "Pending verification" status card; the submit form is hidden
4. Admin side (in another browser / incognito):
   - Sign in as `admin@dokanpro.com`
   - Open `/admin/subscriptions`
   - The new request should appear immediately (live `subscription:submitted` toast)
   - Click **Approve**
5. Staff side:
   - Toast: "Subscription active"
   - Subscription badge in topbar flips back to green
   - Click **POS Sale** — fully unlocked

### F. Rejection flow

1. As staff, expire the active sub again (Mongo shell), then submit a new payment
2. As admin, in `/admin/subscriptions` → click **Reject**
3. Enter reason: `Transaction ID not found`
4. Confirm
5. Staff side:
   - Toast: "Payment rejected — Transaction ID not found"
   - Status card shows the rejection reason
   - Submit form is visible again so they can retry

### G. Extend flow

1. As admin in `/admin/subscriptions`, filter by **Active**
2. Click **Extend** on any active subscription
3. Pick `+30d` → confirm
4. Staff side:
   - Toast: "Subscription extended"
   - Subscription badge updates the day counter

### H. Real-time stock sync (multi-tab)

1. Open the staff POS in **two browser tabs**
2. In tab A, sell a product
3. In tab B, the corresponding stock number on the tile decrements **without a page reload**
4. If stock drops below 10, both tabs show a "Low stock alert" toast

### I. Auto-expiry sweep

The hourly sweep is already running. To force-test it:

1. Set `endDate` of an active subscription to a date in the past (Mongo shell)
2. Restart the backend (or wait up to 1 hour)
3. Backend logs: `[expiry] swept N expired subscription(s)`
4. Staff browser receives `subscription:expired` toast and is redirected to `/subscription` on next protected request

---

# 🛠️ Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `[db] connection error: ...` on backend boot | `MONGODB_URI` wrong or unreachable | Verify URI; URL-encode special characters in the password |
| `401 No token provided` for every request | Token missing / expired | Sign out + sign in again; confirm `JWT_SECRET` matches between restarts |
| Frontend can't reach backend (CORS error) | `CORS_ORIGIN` doesn't include the frontend URL | Add `http://localhost:5173` (or whatever port Vite uses) to backend `.env` `CORS_ORIGIN` |
| Vite picks port 5174 instead of 5173 | Port already in use | Add the new port to `CORS_ORIGIN` too, or kill the conflicting process |
| `subscription_required` even after admin approval | Stale frontend cache | The frontend auto-refetches on the socket event; if disconnected, reload the page |
| Login rate-limited | More than 20 failed logins in 15 minutes | Wait or lower rate limit in `auth.routes.js` |

---

# 📜 License

Proprietary — © DokanPro. All rights reserved.

---

# 🙋 Support

For issues, feature requests, or onboarding help, contact the platform admin at the email associated with your `admin@` account.
