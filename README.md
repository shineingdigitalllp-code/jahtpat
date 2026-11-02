# Jhatpat

Mobile-first 10-minute grocery delivery platform.

## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment**:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```
   *Ensure MySQL is running on port 3306 with database `jhatpat` created.*

3. **Database**:
   ```bash
   pnpm --filter @jhatpat/api db:migrate
   pnpm --filter @jhatpat/api db:seed
   ```

## Run Project

Start all apps concurrently:
```bash
pnpm dev:all
```

Or run individually:

- **Customer Storefront** (Frontend): `pnpm dev` → http://localhost:3000
- **Admin Portal** (Dashboard): `pnpm dev:admin` → http://localhost:3001
- **Backend API**: `pnpm dev:api` → http://localhost:4000/api/v1

## Login Credentials

### Admin Portal (http://localhost:3001)
- **Email**: `admin@jhatpat.com`
- **Password**: `abcd123456`
*(First-time setup can also register directly at http://localhost:3001/register)*

### Storefront Customer (http://localhost:3000)
- **Mobile**: `9876543210`
- **Password**: `demo1234`
