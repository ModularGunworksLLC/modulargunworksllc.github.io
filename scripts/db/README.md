# Neon backend (Modular Gunworks)

## Setup (once)

1. Set `DATABASE_URL` in `.env` (Neon connection string).
2. Apply schema: `npm run db:schema`
3. Seed categories: `npm run db:seed`
4. Import from existing JSON: `npm run db:import` (run from project root)

Optional: set `ADMIN_PASSWORD` in `.env` for admin dashboard login (default: `admin`).

## Running for testing

- Terminal 1: `npm start` (site on http://localhost:3000)
- Terminal 2: `npm run api` (API on http://localhost:3001)

When both are running, shop pages and product detail use the Neon-backed API when opened from http://localhost:3000. Admin dashboard: http://localhost:3000/admin.html (login with ADMIN_PASSWORD).

## Branch

All backend work is on `feature/neon-admin-dashboard`. Do not push to `main`.
