# DokanPro Backend

Express + MongoDB + Socket.IO POS backend.

## Setup

```bash
cd backend
yarn install              # or: npm install
cp .env.example .env      # then edit MONGODB_URI + JWT_SECRET
yarn seed                 # creates demo admin + sample products
yarn dev                  # http://localhost:4000
```

## Demo credentials (after seeding)

- **Admin**: `admin@dokanpro.com` / `admin123`
- **Staff**: `staff@dokanpro.com` / `staff123`

## API surface

| Resource | Routes |
|----------|--------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` |
| Products | `GET /api/products`, `POST /api/products`, `GET /api/products/:id`, `PUT /api/products/:id`, `DELETE /api/products/:id`, `GET /api/products/barcode/:code` |
| Orders | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id` |
| Customers | `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`, `DELETE /api/customers/:id` |

All routes (except login) require `Authorization: Bearer <token>`.

## Real-time events

Connect with `io(URL, { auth: { token } })`. Events emitted server → client:

- `stock:updated` — `{ productId, stock }`
- `order:created` — full order
- `low-stock:alert` — when stock crosses 10

## Scripts

- `yarn dev` — nodemon
- `yarn start` — production
- `yarn seed` — wipe + seed demo data
