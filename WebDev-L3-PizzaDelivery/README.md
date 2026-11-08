# 🍕 Basilico — Pizza Delivery App (MERN)

**Oasis Infobyte Internship · Web Development & Designing · Level 3**
**Author:** Yousef Hassan Yousef Douhan

A full-stack pizza ordering system. Customers build their own pizza in four steps, pay online and follow the order live from the kitchen to delivery. The admin runs a kitchen board, manages stock and gets an email when an ingredient runs low.

> 🎥 **Demo video:** _add the LinkedIn post link here_

---

## Features

### Customer
- [x] Registration with **email verification** (link valid 24 h, one-time use, resend option)
- [x] Login with **JWT**
- [x] **Forgot / reset password** by email (link valid 15 min, one-time use)
- [x] Dashboard with the available pizza varieties (each one can be customised)
- [x] **4-step pizza builder** — base (5 options), sauce (5), cheese, vegetables (multi-select) — with a live drawing of the pizza
- [x] Order summary with the price **calculated on the server**
- [x] Checkout through a **Razorpay-style test payment** (success and failure)
- [x] **Live order status** (Order received → In the kitchen → Sent to delivery) without refreshing

### Admin
- [x] Separate admin login (admins cannot be created from the public sign-up)
- [x] Kitchen board: new paid orders appear instantly; move an order to the next stage
- [x] Inventory of bases, sauces, cheese and vegetables with manual restocking and alert thresholds
- [x] **Stock is reduced automatically** after every paid order (atomic, can never go below zero)
- [x] **Low-stock email** to the admin (node-cron, every 5 minutes and after each order; one email per item until it is restocked)

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, Axios, socket.io-client, react-hot-toast |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| Auth & security | JWT, bcrypt, express-validator, helmet, express-rate-limit, hashed one-time tokens |
| Real-time | Socket.io (JWT-authenticated rooms per user and for admins) |
| Email | Nodemailer (Mailtrap sandbox in development) |
| Jobs | node-cron |
| Payments | Razorpay-compatible gateway layer (mock provider by default, see below) |

---

## About the payment gateway

The task asks for **Razorpay in Test Mode**. Razorpay sign-up requires an Indian **PAN** number, which I cannot obtain because I live outside India (Palestine), so I could not create an account or generate test keys. I reported this to the Oasis Infobyte team.

To keep the exact same flow, the payment code is isolated in [`server/src/services/payment.service.js`](server/src/services/payment.service.js) and follows Razorpay's contract step by step:

1. `POST /api/orders/checkout` — the server prices the pizza and creates a gateway order (`order_…`)
2. The customer pays in a checkout window → the gateway returns `payment_id` and `signature`
3. `POST /api/orders/verify` — the server checks `HMAC_SHA256(order_id | payment_id, secret)` before accepting the order, then marks it paid and deducts stock in one MongoDB transaction

With `PAYMENT_PROVIDER=mock` (default), step 2 is simulated by the server, and a fake or tampered signature is rejected exactly as with Razorpay. Switching to real Razorpay needs **no code changes** — set `PAYMENT_PROVIDER=razorpay` and the two keys in `.env`; the frontend then opens the official Razorpay checkout.

---

## Screenshots

| | |
| --- | --- |
| ![Login](screenshots/01-login.png) Login | ![Menu](screenshots/02-menu.png) Pizza varieties |
| ![Builder](screenshots/03-builder.png) 4-step builder | ![Checkout](screenshots/04-checkout.png) Test payment |
| ![My orders](screenshots/05-my-orders.png) Live order status | ![Kitchen board](screenshots/06-kitchen-board.png) Admin kitchen board |
| ![Inventory](screenshots/07-inventory.png) Admin inventory | ![Low stock email](screenshots/08-low-stock-email.png) Low-stock email |

---

## Run it locally

**Requirements:** Node.js 20+, a free MongoDB Atlas cluster, a free Mailtrap inbox.

```bash
# 1. Backend
cd server
npm install
cp .env.example .env        # then fill in the values (see below)
npm run seed                # creates the admin, 21 ingredients and 5 pizzas
npm run dev                 # http://localhost:5000

# 2. Frontend (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api` and `/socket.io` to the backend, so no CORS setup is needed in development.

### Environment variables (`server/.env`)

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend URL, used in email links and CORS (`http://localhost:5173`) |
| `MONGO_URI` | MongoDB Atlas connection string, database `pizza_delivery` |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing secret and lifetime (`7d`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | SMTP settings (Mailtrap sandbox) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by `npm run seed`; low-stock alerts go to this email |
| `STOCK_THRESHOLD` | Default alert threshold for new ingredients (`20`) |
| `PAYMENT_PROVIDER` | `mock` (default) or `razorpay` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Only needed when `PAYMENT_PROVIDER=razorpay` |

### API test script (Windows PowerShell)

```powershell
cd server
powershell -ExecutionPolicy Bypass -File scripts\test-order-flow.ps1
```

It logs in, builds a pizza, tries a failed payment and a fake signature (both rejected), pays, checks the stock went down, moves the order through the kitchen as admin and confirms the customer sees the final status.

---

## API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Create account, send verification email |
| GET | `/api/auth/verify/:token` | public | Verify email |
| POST | `/api/auth/resend-verification` | public | New verification link |
| POST | `/api/auth/login` | public | Customer login → JWT |
| POST | `/api/auth/forgot-password` | public | Send reset link |
| POST | `/api/auth/reset-password/:token` | public | Set new password |
| GET | `/api/auth/me` | user | Current user |
| GET | `/api/pizzas` | user | Pizza varieties |
| GET | `/api/inventory/options` | user | Builder options by category |
| POST | `/api/orders/quote` | user | Server-side price |
| POST | `/api/orders/checkout` | user | Pending order + gateway order |
| POST | `/api/orders/mock-pay` | user | Simulated checkout (mock provider) |
| POST | `/api/orders/verify` | user | Verify signature, place order, deduct stock |
| GET | `/api/orders/my` | user | Customer's orders |
| POST | `/api/admin/login` | public | Admin login → JWT |
| GET | `/api/admin/inventory` | admin | All ingredients |
| PATCH | `/api/admin/inventory/:id` | admin | Update quantity / threshold / price / visibility |
| GET | `/api/admin/orders` | admin | Paid orders (filter `?status=`) |
| PATCH | `/api/admin/orders/:id/status` | admin | Move to the next status |

**Socket.io events:** `order:status` → the customer's room · `order:new`, `order:updated`, `inventory:updated` → admins.

---

## Project structure

```
WebDev-L3-PizzaDelivery/
├── client/                      React + Vite
│   └── src/
│       ├── api/                 axios instance (JWT header)
│       ├── components/          Layout, PizzaPreview (SVG), CheckoutModal, StatusTracker…
│       ├── context/             AuthContext
│       ├── hooks/               useSocket
│       └── pages/               auth/ · user/ (Menu, Builder, MyOrders) · admin/ (Orders, Inventory)
├── server/                      Express API
│   ├── scripts/                 test-order-flow.ps1
│   └── src/
│       ├── config/              MongoDB, mailer
│       ├── models/              User, Inventory, Pizza, Order
│       ├── controllers/         auth, catalog, order, admin
│       ├── routes/
│       ├── middleware/          auth (JWT + admin), validation, rate limit
│       ├── services/            payment, order (pricing + stock), socket, email
│       ├── jobs/                low-stock cron
│       └── seed/                admin + inventory + pizzas
└── screenshots/
```

## Security notes
- Passwords hashed with bcrypt; verification and reset tokens are stored as SHA-256 hashes and expire.
- Prices are never trusted from the browser; the server recalculates them from the database.
- Payment is accepted only after signature verification; stock deduction and order confirmation run in one transaction.
- Login, register and reset endpoints are rate-limited; all inputs are validated.
- Secrets live in `.env`, which is git-ignored (`.env.example` documents the variables).
