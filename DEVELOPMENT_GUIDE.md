# 📖 BookmyTrip — Complete Developer Setup Guide

> **Read this before writing a single line of code.**
> This guide assumes you know nothing. Every command tells you exactly which folder to run it in. Every config tells you exactly what to change and why. Follow it top to bottom, in order.

---

## 📌 Table of Contents

1. [What We're Building](#1-what-were-building)
2. [Tools You Need to Install (Global)](#2-tools-you-need-to-install-global)
3. [Create the Project Folder Structure](#3-create-the-project-folder-structure)
4. [Initialize the Monorepo](#4-initialize-the-monorepo)
5. [Configure TypeScript (Root)](#5-configure-typescript-root)
6. [Configure Turborepo](#6-configure-turborepo)
7. [Set Up Shared Packages](#7-set-up-shared-packages)
8. [Set Up the Frontend (apps/web)](#8-set-up-the-frontend-appsweb)
9. [Set Up Storybook (apps/storybook)](#9-set-up-storybook-appsstorybook)
10. [Set Up a Microservice (Template)](#10-set-up-a-microservice-template)
11. [Set Up All 17 Services](#11-set-up-all-17-services)
12. [Docker Setup (Local Dev Environment)](#12-docker-setup-local-dev-environment)
13. [Environment Variables](#13-environment-variables)
14. [Running Everything Locally](#14-running-everything-locally)
15. [Setting Up the API Gateway](#15-setting-up-the-api-gateway)
16. [Monitoring Stack](#16-monitoring-stack)
17. [Common Errors & Fixes](#17-common-errors--fixes)
18. [Folder Checklist](#18-folder-checklist)

---

## 1. What We're Building

BookmyTrip is a **travel booking platform** similar to MakeMyTrip or Booking.com. It has:

- A **Next.js frontend** where users search and book flights, hotels, trains, cabs, and tours
- **17 backend microservices**, each responsible for one domain (auth, flights, payments, etc.)
- All services communicate through an **API Gateway**
- Databases: **MongoDB** (main), **Redis** (cache), **Elasticsearch** (search), **RabbitMQ** (async messaging)
- Everything runs locally via **Docker**

The project is a **monorepo** — one Git repository containing all frontend, backend services, and shared code. We use **Turborepo** to manage it and **pnpm** as the package manager.

---

## 2. Tools You Need to Install (Global)

Install these **on your machine** (not inside the project) before starting.

### 2.1 Node.js

We need **Node.js v20 or higher** (LTS).

Check if you have it:
```bash
# Run this anywhere
node --version
```

If you see `v20.x.x` or higher, you're good. If not, download it from: https://nodejs.org → choose the **LTS** version.

> ⚠️ Do NOT use Node v18 or lower. Some packages require v20+.

### 2.2 pnpm (Package Manager)

We use **pnpm** instead of npm because it handles monorepos far better.

```bash
# Run this anywhere (after installing Node)
npm install -g pnpm
```

Verify:
```bash
pnpm --version
# Should output: 8.x.x or higher
```

### 2.3 Git

Check if you have it:
```bash
git --version
```

If not, download from: https://git-scm.com/downloads

### 2.4 Docker Desktop

Docker runs all your databases and services locally without installing them individually.

Download from: https://www.docker.com/products/docker-desktop

After installing, open Docker Desktop and make sure it's running (you'll see a whale icon in your taskbar/menu bar).

```bash
# Verify
docker --version
docker compose version
```

You need `docker compose` (v2, no hyphen). If you see `docker-compose: command not found`, you have the old version — update Docker Desktop.

### 2.5 VS Code (Recommended Editor)

Download from: https://code.visualstudio.com

Recommended extensions (install inside VS Code):
- **ESLint** — code linting
- **Prettier** — code formatting
- **TypeScript Hero** — TS helpers
- **Docker** — manage containers from VS Code
- **MongoDB for VS Code** — browse your databases

---

## 3. Create the Project Folder Structure

Open your terminal. Navigate to your Desktop (or wherever you store projects):

```bash
# Windows
cd C:\Users\YourName\Desktop

# Mac/Linux
cd ~/Desktop
```

Create the main project folder:
```bash
mkdir BookmyTrip
cd BookmyTrip
```

Now create ALL the folders at once. Copy and paste this entire block:

```bash
# Create all top-level directories
mkdir -p apps/web/src
mkdir -p apps/web/public/images
mkdir -p apps/web/cypress
mkdir -p apps/storybook/stories
mkdir -p packages/shared-types/src
mkdir -p packages/shared-utils/src
mkdir -p packages/eslint-config
mkdir -p services/api-gateway/src
mkdir -p services/auth-service/src
mkdir -p services/user-service/src
mkdir -p services/booking-service/src
mkdir -p services/flight-service/src
mkdir -p services/hotel-service/src
mkdir -p services/train-service/src
mkdir -p services/cab-service/src
mkdir -p services/tour-service/src
mkdir -p services/payment-service/src
mkdir -p services/notification-service/src
mkdir -p services/review-service/src
mkdir -p services/search-service/src
mkdir -p services/chat-service/src
mkdir -p services/media-service/src
mkdir -p services/ai-service/src
mkdir -p services/admin-service/src
mkdir -p docker/volumes
mkdir -p k8s/base
mkdir -p k8s/databases/mongodb
mkdir -p k8s/databases/redis
mkdir -p k8s/databases/rabbitmq
mkdir -p k8s/databases/elasticsearch
mkdir -p k8s/services
mkdir -p k8s/monitoring/prometheus
mkdir -p k8s/monitoring/grafana/dashboards
mkdir -p k8s/monitoring/jaeger
mkdir -p k8s/helm/bookmytrip/templates
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/alertmanager
mkdir -p monitoring/datadog
mkdir -p nginx
mkdir -p scripts
mkdir -p docs
mkdir -p terraform
```

Verify the structure was created:
```bash
# You should see all the folders listed
ls
# apps  docker  docs  k8s  monitoring  nginx  packages  scripts  services  terraform
```

---

## 4. Initialize the Monorepo

You should be inside `BookmyTrip/` for all of the following steps in this section.

```bash
# Confirm you're in the right place
pwd
# Should output: .../Desktop/BookmyTrip
```

### 4.1 Initialize Git

```bash
# Inside: BookmyTrip/
git init
```

Create a `.gitignore` file:
```bash
# Inside: BookmyTrip/
```

Create the file `BookmyTrip/.gitignore` with this content:
```
node_modules/
.next/
dist/
build/
.turbo/
*.env
.env.local
.env.*.local
docker/volumes/
.DS_Store
coverage/
*.log
```

### 4.2 Create the pnpm Workspace File

Create the file `BookmyTrip/pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
```

This tells pnpm: "everything inside apps/, services/, and packages/ is a workspace package."

### 4.3 Initialize the Root package.json

```bash
# Inside: BookmyTrip/
pnpm init
```

Now open `package.json` and replace its content with:
```json
{
  "name": "bookmytrip",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^1.13.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### 4.4 Install Turborepo

```bash
# Inside: BookmyTrip/
pnpm install
```

You'll see a `node_modules/` folder appear at the root and a `pnpm-lock.yaml` file. That's correct.

---

## 5. Configure TypeScript (Root)

This is the **most important TypeScript file** in the project. Every service and app will extend this. Getting this right prevents 90% of TypeScript errors later.

Create the file `BookmyTrip/tsconfig.base.json`:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "incremental": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

> ⚠️ **Why these choices?**
> - `"module": "CommonJS"` — All backend services use CommonJS (`require`/`module.exports`). We do NOT use `"module": "ESNext"` for services because Node.js handles CommonJS natively without needing `.js` extensions everywhere.
> - `"target": "ES2022"` — Modern enough to use async/await, optional chaining, etc.
> - `"esModuleInterop": true` — Lets you do `import express from 'express'` instead of `import * as express from 'express'`
> - `"strict": true` — Catches bugs early. Never disable this.
> - `"skipLibCheck": true` — Skips type-checking inside `node_modules`. Speeds up compilation significantly.

---

## 6. Configure Turborepo

Create the file `BookmyTrip/turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

> What this does: When you run `pnpm dev` from the root, Turborepo runs `dev` in ALL packages/apps/services simultaneously. When you run `pnpm build`, it builds packages first (`^build` means "build my dependencies first"), then apps and services.

---

## 7. Set Up Shared Packages

These are built first because everything else depends on them.

### 7.1 `packages/shared-types`

```bash
# Navigate to: BookmyTrip/packages/shared-types/
cd packages/shared-types
```

Create `BookmyTrip/packages/shared-types/package.json`:
```json
{
  "name": "@bookmytrip/shared-types",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

Create `BookmyTrip/packages/shared-types/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

Create `BookmyTrip/packages/shared-types/src/index.ts`:
```typescript
// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
}

// Booking Types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
export type BookingType = 'flight' | 'hotel' | 'train' | 'cab' | 'tour';

export interface Booking {
  _id: string;
  userId: string;
  type: BookingType;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

```bash
# Go back to root
cd ../..
```

### 7.2 `packages/shared-utils`

```bash
# Navigate to: BookmyTrip/packages/shared-utils/
cd packages/shared-utils
```

Create `BookmyTrip/packages/shared-utils/package.json`:
```json
{
  "name": "@bookmytrip/shared-utils",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@bookmytrip/shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

Create `BookmyTrip/packages/shared-utils/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

Create `BookmyTrip/packages/shared-utils/src/index.ts`:
```typescript
// Date helpers
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Price helpers
export const formatPrice = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};

// Error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

```bash
# Go back to root
cd ../..
```

### 7.3 `packages/eslint-config`

Create `BookmyTrip/packages/eslint-config/package.json`:
```json
{
  "name": "@bookmytrip/eslint-config",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0"
  }
}
```

Create `BookmyTrip/packages/eslint-config/index.js`:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  env: {
    node: true,
    es2022: true,
  },
};
```

---

## 8. Set Up the Frontend (`apps/web`)

```bash
# Navigate to: BookmyTrip/apps/
cd apps
```

Create the Next.js app:
```bash
# Inside: BookmyTrip/apps/
pnpm create next-app@latest web --typescript --tailwind --app --no-src-prompt --import-alias "@/*"
```

When prompted:
- **Would you like to use ESLint?** → Yes
- **Would you like to use Tailwind CSS?** → Yes
- **Would you like to use the App Router?** → Yes
- **Would you like to customize the import alias?** → Yes, use `@/*`

> ⚠️ This will create `apps/web/` with its own `package.json` and `tsconfig.json`. We need to modify both.

```bash
# Navigate to: BookmyTrip/apps/web/
cd web
```

Open `BookmyTrip/apps/web/package.json` and update the name and add shared packages:
```json
{
  "name": "@bookmytrip/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:e2e": "cypress open"
  },
  "dependencies": {
    "@bookmytrip/shared-types": "workspace:*",
    "@bookmytrip/shared-utils": "workspace:*",
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@bookmytrip/eslint-config": "workspace:*",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8",
    "eslint-config-next": "14.2.0",
    "jest": "^29.0.0",
    "cypress": "^13.0.0"
  }
}
```

Now update `BookmyTrip/apps/web/tsconfig.json`. Replace the entire file with:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "outDir": ".next"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> ⚠️ **Important — the frontend tsconfig is different from backend:**
> - Frontend uses `"module": "ESNext"` and `"moduleResolution": "bundler"` — Next.js (via Webpack/Turbopack) handles bundling, so we use modern ESM syntax.
> - Backend services use `"module": "CommonJS"` because Node.js runs them directly.
> - The `"lib": ["dom", ...]` is needed because the frontend runs in a browser and uses browser APIs like `window`, `document`, `fetch`.
> - We still `"extends": "../../tsconfig.base.json"` but **override** module-related options here.

Install frontend dependencies:
```bash
# Inside: BookmyTrip/apps/web/
pnpm install
```

```bash
# Go back to root
cd ../..
```

---

## 9. Set Up Storybook (`apps/storybook`)

```bash
# Navigate to: BookmyTrip/apps/storybook/
cd apps/storybook
```

Create `BookmyTrip/apps/storybook/package.json`:
```json
{
  "name": "@bookmytrip/storybook",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build",
    "storybook": "storybook dev -p 6006"
  },
  "devDependencies": {
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/nextjs": "^8.0.0",
    "@storybook/react": "^8.0.0",
    "storybook": "^8.0.0",
    "typescript": "^5.4.0"
  },
  "dependencies": {
    "@bookmytrip/shared-types": "workspace:*"
  }
}
```

```bash
# Go back to root
cd ../..
```

---

## 10. Set Up a Microservice (Template)

Every service follows the same pattern. We'll set up `auth-service` fully as a template, then you repeat for all others.

```bash
# Navigate to: BookmyTrip/services/auth-service/
cd services/auth-service
```

### 10.1 package.json for a service

Create `BookmyTrip/services/auth-service/package.json`:
```json
{
  "name": "@bookmytrip/auth-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@bookmytrip/shared-types": "workspace:*",
    "@bookmytrip/shared-utils": "workspace:*",
    "express": "^4.18.0",
    "mongoose": "^8.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0",
    "amqplib": "^0.10.0",
    "ioredis": "^5.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@bookmytrip/eslint-config": "workspace:*",
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/cors": "^2.8.0",
    "@types/amqplib": "^0.10.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### 10.2 tsconfig.json for a service

Create `BookmyTrip/services/auth-service/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> This is simple — it just extends the root config and points to `src/` as the source.

### 10.3 Create the service folder structure

```bash
# Inside: BookmyTrip/services/auth-service/
mkdir -p src/controllers
mkdir -p src/routes
mkdir -p src/models
mkdir -p src/services
mkdir -p src/middleware
mkdir -p src/utils
mkdir -p src/config
```

### 10.4 Create the main entry point

Create `BookmyTrip/services/auth-service/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Routes (add as you build)
// app.use('/api/auth', authRoutes);

// Start server
app.listen(PORT, () => {
  console.info(`[auth-service] running on port ${PORT}`);
});

export default app;
```

### 10.5 Create a .env file for the service

Create `BookmyTrip/services/auth-service/.env`:
```env
PORT=3001
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/auth_db

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

> ⚠️ Never commit `.env` files to Git. They're already in `.gitignore`.

### 10.6 Install dependencies

```bash
# Inside: BookmyTrip/services/auth-service/
pnpm install
```

```bash
# Go back to root
cd ../..
```

---

## 11. Set Up All 17 Services

Repeat the process from Section 10 for every service below. The only things that change are the **service name** and **port number**.

| Service folder | package.json name | PORT |
|---|---|---|
| `api-gateway` | `@bookmytrip/api-gateway` | 3000 |
| `auth-service` | `@bookmytrip/auth-service` | 3001 ← done above |
| `user-service` | `@bookmytrip/user-service` | 3002 |
| `booking-service` | `@bookmytrip/booking-service` | 3003 |
| `flight-service` | `@bookmytrip/flight-service` | 3004 |
| `hotel-service` | `@bookmytrip/hotel-service` | 3005 |
| `train-service` | `@bookmytrip/train-service` | 3006 |
| `cab-service` | `@bookmytrip/cab-service` | 3007 |
| `tour-service` | `@bookmytrip/tour-service` | 3008 |
| `payment-service` | `@bookmytrip/payment-service` | 3009 |
| `notification-service` | `@bookmytrip/notification-service` | 3010 |
| `review-service` | `@bookmytrip/review-service` | 3011 |
| `search-service` | `@bookmytrip/search-service` | 3012 |
| `chat-service` | `@bookmytrip/chat-service` | 3013 |
| `media-service` | `@bookmytrip/media-service` | 3014 |
| `ai-service` | `@bookmytrip/ai-service` | 3015 |
| `admin-service` | `@bookmytrip/admin-service` | 3016 |

For each service, from `BookmyTrip/services/<service-name>/`:
1. Copy the `package.json` from Section 10.1, change the `name` field and the `PORT` in `.env`
2. Copy the `tsconfig.json` exactly as-is (it's identical for all services)
3. Create the `src/` subfolders
4. Copy the `src/index.ts`, changing the service name string and the default PORT
5. Create the `.env` with the correct PORT and `MONGO_URI` database name (e.g., `user_db`, `booking_db`)
6. Run `pnpm install`

**Shortcut:** After creating files for each service manually, you can install all dependencies at once from the root:
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm install
```
Running `pnpm install` from the root installs dependencies for ALL workspaces at once.

---

## 12. Docker Setup (Local Dev Environment)

Docker replaces installing MongoDB, Redis, RabbitMQ, and Elasticsearch manually. Everything runs in containers.

### 12.1 Main Docker Compose File

Create `BookmyTrip/docker/docker-compose.yml`:
```yaml
version: '3.9'

networks:
  bookmytrip-network:
    driver: bridge

volumes:
  mongodb-data:
  redis-data:
  rabbitmq-data:
  elasticsearch-data:

services:
  # ─── DATABASES ───────────────────────────────────────

  mongodb:
    image: mongo:7.0
    container_name: bmt-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    networks:
      - bookmytrip-network
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    restart: unless-stopped

  redis:
    image: redis:7.2-alpine
    container_name: bmt-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - bookmytrip-network
    restart: unless-stopped

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: bmt-rabbitmq
    ports:
      - "5672:5672"    # AMQP port (services connect here)
      - "15672:15672"  # Management UI (open in browser)
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - bookmytrip-network
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    restart: unless-stopped

  elasticsearch:
    image: elasticsearch:8.13.0
    container_name: bmt-elasticsearch
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - bookmytrip-network
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    restart: unless-stopped
```

> In local development, you run the databases in Docker but run the **services directly with `pnpm dev`** (not in Docker). This makes development faster because you get hot-reload.

### 12.2 Start the databases

```bash
# Inside: BookmyTrip/docker/
cd docker
docker compose up -d
```

The `-d` flag runs in the background (detached mode).

Check they're all running:
```bash
# Inside: BookmyTrip/docker/
docker compose ps
```

You should see 4 containers all with status `running`.

Useful management URLs (open in browser):
- **RabbitMQ Management**: http://localhost:15672 (login: guest/guest)
- **Elasticsearch**: http://localhost:9200

```bash
# Go back to root
cd ..
```

### 12.3 Update .env files to use Docker databases

Since MongoDB is now running in Docker, update the `MONGO_URI` in each service's `.env`. The connection string changes because MongoDB requires a username and password now:

For `auth-service/.env`:
```env
MONGO_URI=mongodb://root:password@localhost:27017/auth_db?authSource=admin
```

Do the same for all services, just change the database name at the end (`auth_db`, `user_db`, `booking_db`, etc.).

---

## 13. Environment Variables

### 13.1 Create a root `.env.example`

Create `BookmyTrip/.env.example` (this is safe to commit — it's just an example):
```env
# ─── SHARED across all services ───
NODE_ENV=development
MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=password
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# ─── JWT ───
JWT_SECRET=replace-with-a-long-random-string-minimum-32-chars
JWT_EXPIRES_IN=7d

# ─── Service ports ───
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
BOOKING_SERVICE_PORT=3003
FLIGHT_SERVICE_PORT=3004
HOTEL_SERVICE_PORT=3005
TRAIN_SERVICE_PORT=3006
CAB_SERVICE_PORT=3007
TOUR_SERVICE_PORT=3008
PAYMENT_SERVICE_PORT=3009
NOTIFICATION_SERVICE_PORT=3010
REVIEW_SERVICE_PORT=3011
SEARCH_SERVICE_PORT=3012
CHAT_SERVICE_PORT=3013
MEDIA_SERVICE_PORT=3014
AI_SERVICE_PORT=3015
ADMIN_SERVICE_PORT=3016
```

---

## 14. Running Everything Locally

### Step 1: Start databases (Docker)
```bash
# Inside: BookmyTrip/docker/
cd docker
docker compose up -d
cd ..
```

### Step 2: Build shared packages first
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm --filter @bookmytrip/shared-types build
pnpm --filter @bookmytrip/shared-utils build
```

> ⚠️ You must build shared packages before running services because services import from `@bookmytrip/shared-types`. The built output goes to `packages/shared-types/dist/`. Without running build first, imports will fail with "Cannot find module" errors.

### Step 3: Run all services in dev mode
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm dev
```

This runs `pnpm dev` in every workspace simultaneously thanks to Turborepo. You'll see output from all services in one terminal.

Or, to run a single service:
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm --filter @bookmytrip/auth-service dev

# Or navigate to the service:
# Inside: BookmyTrip/services/auth-service/
pnpm dev
```

### Step 4: Run the frontend
```bash
# In a new terminal
# Inside: BookmyTrip/apps/web/
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## 15. Setting Up the API Gateway

The API Gateway is the most important service. All frontend requests go through it.

```bash
# Navigate to: BookmyTrip/services/api-gateway/
cd services/api-gateway
```

Install additional gateway-specific packages:
```bash
# Inside: BookmyTrip/services/api-gateway/
pnpm add http-proxy-middleware express-jwt morgan
pnpm add -D @types/morgan
```

Create `BookmyTrip/services/api-gateway/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Route proxying
const serviceRoutes: Record<string, string> = {
  '/api/auth':         `http://localhost:3001`,
  '/api/users':        `http://localhost:3002`,
  '/api/bookings':     `http://localhost:3003`,
  '/api/flights':      `http://localhost:3004`,
  '/api/hotels':       `http://localhost:3005`,
  '/api/trains':       `http://localhost:3006`,
  '/api/cabs':         `http://localhost:3007`,
  '/api/tours':        `http://localhost:3008`,
  '/api/payments':     `http://localhost:3009`,
  '/api/notifications':`http://localhost:3010`,
  '/api/reviews':      `http://localhost:3011`,
  '/api/search':       `http://localhost:3012`,
  '/api/chat':         `http://localhost:3013`,
  '/api/media':        `http://localhost:3014`,
  '/api/ai':           `http://localhost:3015`,
  '/api/admin':        `http://localhost:3016`,
};

Object.entries(serviceRoutes).forEach(([path, target]) => {
  app.use(path, createProxyMiddleware({ target, changeOrigin: true }));
});

app.listen(PORT, () => {
  console.info(`[api-gateway] running on port ${PORT}`);
});
```

```bash
# Go back to root
cd ../..
```

---

## 16. Monitoring Stack

The monitoring stack (Prometheus + Grafana) runs separately via Docker Compose.

Create `BookmyTrip/monitoring/prometheus/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert-rules.yml"

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['host.docker.internal:3000']

  - job_name: 'auth-service'
    static_configs:
      - targets: ['host.docker.internal:3001']

  # Add all other services here following the same pattern
```

Create `BookmyTrip/docker/docker-compose.monitoring.yml`:
```yaml
version: '3.9'

networks:
  bookmytrip-network:
    external: true

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: bmt-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ../monitoring/prometheus:/etc/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    networks:
      - bookmytrip-network

  grafana:
    image: grafana/grafana:latest
    container_name: bmt-grafana
    ports:
      - "3030:3000"
    volumes:
      - ../monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ../monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    networks:
      - bookmytrip-network
```

Start the monitoring stack:
```bash
# Inside: BookmyTrip/docker/
cd docker
docker compose -f docker-compose.monitoring.yml up -d
cd ..
```

Open Grafana at http://localhost:3030 (login: admin/admin).

---

## 17. Common Errors & Fixes

### ❌ Error: `Cannot find module '@bookmytrip/shared-types'`
**Cause:** Shared packages haven't been built yet.
**Fix:**
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm --filter @bookmytrip/shared-types build
pnpm --filter @bookmytrip/shared-utils build
```

### ❌ Error: `Module '"express"' has no exported member...` or default import errors
**Cause:** `esModuleInterop` is not set to `true`.
**Fix:** Make sure `"esModuleInterop": true` is in your `tsconfig.base.json`. Do not delete it.

### ❌ Error: `error TS5023: Unknown compiler option 'moduleResolution: bundler'`
**Cause:** Your TypeScript version is too old (below 5.0).
**Fix:**
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm add -D typescript@latest -w
```

### ❌ Error: `Cannot use import statement in a module` (in a service)
**Cause:** A service's tsconfig has `"module": "ESNext"` instead of `"CommonJS"`.
**Fix:** In that service's `tsconfig.json`, make sure you DON'T override `module`. The base config sets `"module": "CommonJS"`, which is what you want for backend services.

### ❌ Error: `connect ECONNREFUSED 127.0.0.1:27017` (MongoDB connection refused)
**Cause:** Docker containers aren't running.
**Fix:**
```bash
# Inside: BookmyTrip/docker/
cd docker
docker compose up -d
docker compose ps  # check all are running
cd ..
```

### ❌ Error: `pnpm: command not found`
**Fix:** Close your terminal and reopen it. If still failing:
```bash
npm install -g pnpm
```

### ❌ Error: `Cannot find module 'ts-node-dev'`
**Cause:** Dependencies weren't installed for that service.
**Fix:**
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm install
```

### ❌ Error: Turborepo says `missing script: dev` for a package
**Cause:** A `package.json` in one of the workspaces doesn't have a `"dev"` script.
**Fix:** Add `"dev": "echo no dev script"` to that package's `package.json` scripts, or add the actual dev command.

### ❌ TypeScript error: `Type 'X' is not assignable to type 'Y'` from shared-types
**Cause:** A service is using a stale version of the compiled shared-types.
**Fix:**
```bash
# Inside: BookmyTrip/  (ROOT)
pnpm --filter @bookmytrip/shared-types clean
pnpm --filter @bookmytrip/shared-types build
```

### ❌ Error: `ENOENT: no such file or directory, open '.../dist/index.js'`
**Cause:** You're trying to run `node dist/index.js` before compiling TypeScript.
**Fix:** Run `pnpm build` in that service first, or use `pnpm dev` which uses `ts-node-dev` and doesn't need a build step.

---

## 18. Folder Checklist

Use this to verify your setup is complete. Every item should exist:

```
BookmyTrip/
├── ✅ .gitignore
├── ✅ pnpm-workspace.yaml
├── ✅ package.json           (root, has turbo as devDep)
├── ✅ pnpm-lock.yaml         (auto-generated, do not edit)
├── ✅ turbo.json
├── ✅ tsconfig.base.json
│
├── apps/
│   ├── web/
│   │   ├── ✅ package.json  (name: @bookmytrip/web)
│   │   ├── ✅ tsconfig.json (extends ../../tsconfig.base.json, module: ESNext)
│   │   ├── ✅ next.config.ts
│   │   ├── ✅ tailwind.config.ts
│   │   └── src/
│   └── storybook/
│       └── ✅ package.json
│
├── packages/
│   ├── shared-types/
│   │   ├── ✅ package.json  (name: @bookmytrip/shared-types)
│   │   ├── ✅ tsconfig.json
│   │   └── src/
│   │       └── ✅ index.ts
│   ├── shared-utils/
│   │   ├── ✅ package.json
│   │   ├── ✅ tsconfig.json
│   │   └── src/
│   │       └── ✅ index.ts
│   └── eslint-config/
│       ├── ✅ package.json
│       └── ✅ index.js
│
├── services/
│   └── (for each of 17 services)
│       ├── ✅ package.json
│       ├── ✅ tsconfig.json (extends ../../tsconfig.base.json)
│       ├── ✅ .env
│       └── src/
│           ├── ✅ index.ts
│           ├── controllers/
│           ├── routes/
│           ├── models/
│           ├── services/
│           ├── middleware/
│           ├── utils/
│           └── config/
│
└── docker/
    └── ✅ docker-compose.yml
```

---

## 🎉 You're Set Up!

At this point you should be able to:

1. Run `cd docker && docker compose up -d` to start all databases
2. Run `pnpm --filter @bookmytrip/shared-types build` to build shared packages
3. Run `pnpm dev` from the root to start all services in development mode
4. Open http://localhost:3000 (api-gateway) and http://localhost:3001/health to verify services are running
5. Open http://localhost:3000 (Next.js) from `apps/web`

From here, start building features service by service. Pick one domain (e.g., auth), build the Mongoose model, the route handlers, and the controller. Then connect the frontend to it through the API gateway.

Good luck! 🚀