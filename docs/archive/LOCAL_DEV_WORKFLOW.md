# Local Docker-First Development Workflow

Date: 2025-11-11

## Your goal
Faster development by testing everything locally with Docker/Supabase before pushing to production. Avoid migration/sync issues during active development.

## Why this is a good idea
- **Local first = faster iteration**: No waiting for remote DB, network, or auth issues. You control the entire stack locally.
- **Sandbox safety**: Break things locally; they don't affect production.
- **Schema as code**: Keep migrations in version control; seed data in Docker when needed.
- **Easy reset**: `supabase db reset` wipes local DB and re-runs migrations from scratch — clean state for testing.
- **Push to production later**: Once stable, one-time sync to actual Supabase project (cloud or self-hosted).

## Architecture (local workflow)

```
┌─────────────────────────────────────────────┐
│  Your Local Machine (Windows + Docker)      │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Docker Containers (Supabase stack) │   │
│  │  - Postgres 17                      │   │
│  │  - PostgREST API                    │   │
│  │  - Auth service                     │   │
│  │  - Storage                          │   │
│  │  - Realtime                         │   │
│  └─────────────────────────────────────┘   │
│             ↑              ↑                │
│             │              │                │
│  ┌──────────────────────────────────────┐  │
│  │  Your App (Node.js/TypeScript)       │  │
│  │  - server/ (Express + Drizzle)       │  │
│  │  - client/ (React + Vite)            │  │
│  │  - Tests (Vitest)                    │  │
│  └──────────────────────────────────────┘  │
│             ↓              ↓                │
│  ┌──────────────────────────────────────┐  │
│  │  shared/schema.ts (Drizzle schema)   │  │
│  │  supabase/migrations/ (SQL)          │  │
│  │  supabase/seeds/ (seed data)         │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
                      ↓ (later, when stable)
         ┌──────────────────────────────┐
         │  Supabase Cloud / Production  │
         │  (one-time sync)              │
         └──────────────────────────────┘
```

## Immediate next steps (ordered)

### Step 1: Verify local Supabase setup (now)
**Goal**: Confirm Docker containers are running and reachable.

```powershell
# Check running Supabase containers
docker ps | Select-String -Pattern "supabase"

# Expected output: should see postgres, postgrest, auth, storage, etc. containers running
```

**Expected**: Tables are already created (you said tables were added). ✓

### Step 2: Inspect local DB schema (verify migrations ran)
**Goal**: Confirm the local Postgres has the correct schema from migrations.

```powershell
# Start psql client inside postgres container (or use psql if installed locally)
# First, find container ID
$CONTAINER_ID = docker ps -q --filter "name=postgres"

# Connect and list tables
docker exec -it $CONTAINER_ID psql -U postgres -c "\dt public.*"

# Or if you have psql locally, connect directly (default: localhost:54322)
# psql -h localhost -p 54322 -U postgres -d postgres -c "\dt public.*"
```

**Expected**: You should see `profiles`, `products`, `categories`, `addresses`, `orders`, etc. tables.

### Step 3: Verify shared schema matches local DB (schema alignment)
**Goal**: Make sure `shared/schema.ts` matches what's in the local Postgres DB.

**Action**: I'll create a simple TypeScript script that:
- Connects to the local Supabase (via Drizzle using DATABASE_URL pointing to localhost:54322).
- Introspects the local DB schema.
- Compares it with the types in `shared/schema.ts`.
- Reports any mismatches.

**Why**: If schema.ts and the DB diverge, your code will have runtime errors or type mismatches. Better to catch this now.

### Step 4: Create a local `.env.local` for development
**Goal**: Configure your app to use the local Supabase stack (not production).

**File**: `Fabric Speaks/.env.local` (or update `.env` for local dev)

```env
# Local Supabase (running in Docker)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP3sSgH8s1uJQvF3VrFQFHw7XO7OlMUwiThgc8K8U
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.MBMLG7Tz5ICm6BjkSTVsxqAG6G8zn2OT1EK-vGsWyao
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Or if you prefer to keep pointing to remote Supabase, that works too
# but then you won't get the full local dev speed benefit
```

**Note**: These are Supabase's *demo/test* keys. They're safe for local Docker dev. For production, use your real Supabase keys.

### Step 5: Run tests locally against Docker DB
**Goal**: Verify your API, repositories, and RBAC logic all work against the real local DB.

```powershell
cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"

# Run the test suite
npm test

# Or specific test files
npm test -- server/__tests__/auth.test.ts
npm test -- server/__tests__/admin.api.test.ts
```

**Expected**: Tests should pass or give clear errors you can fix immediately.

### Step 6: Start the local dev server
**Goal**: Run your Express server and React client against local Docker Supabase.

```powershell
cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"

# Terminal 1: Start the dev server
npm run dev

# Terminal 2: (optional) Watch and rebuild
npm run build:watch
```

**Expected**: Server listens on http://localhost:5173 (or your configured port); connects to local Supabase.

### Step 7: Test admin/user flows locally
**Goal**: Create test data and manually verify admin writes → user reads.

**Steps**:
1. Create a test admin user in the local DB (via Supabase Studio or SQL).
2. Create a test regular user.
3. Admin creates a product via POST `/api/admin/products`.
4. User retrieves products via GET `/api/products`.
5. Verify the product shows up.

**SQL to seed admin user** (run in psql or Supabase Studio):
```sql
INSERT INTO profiles (user_id, username, role)
VALUES (
  gen_random_uuid(),
  'admin_test',
  'admin'
);
```

### Step 8: Add/fix RBAC tests locally
**Goal**: Add automated tests for RBAC (admin-only, ownership checks) and run them.

**File to create**: `server/__tests__/rbac.test.ts`

I'll create a template with tests for:
- Admin can create product, non-admin gets 403.
- User can only update their own address, not someone else's.
- Product reads work for all authenticated users.

### Step 9: Use `supabase db reset` for clean state
**Goal**: When you want a fresh local DB (e.g., after schema changes), reset it.

```powershell
cd "C:/Bhargav/FabricSpeaks/supabase"

# Runs all migrations + seeds from scratch
npx supabase db reset
```

**When to use**: After modifying migrations, or when local DB gets messy during dev.

### Step 10: Push to production (once stable)
**Goal**: One-time sync of your finalized schema to the real Supabase project.

**Prerequisites**:
- All migrations finalized and tested locally.
- `supabase link --project-ref <YOUR_REAL_PROJECT_ID>` (links to your actual Supabase project).
- Backup the production DB first!

**Steps**:
```powershell
cd "C:/Bhargav/FabricSpeaks/supabase"

# Link to the real Supabase project (one-time)
npx supabase link --project-ref jitehefwfoulueiwzmxw

# Push local migrations to remote
npx supabase db push
```

---

## What I can do for you now (pick one)

A) **Quick verification** (5 min)
   - Run schema introspection script to verify local DB matches `shared/schema.ts`.
   - Report any schema mismatches.

B) **Full local setup** (15 min)
   - Verify Docker containers are running.
   - Create `.env.local` for local dev.
   - Run tests to confirm everything works locally.
   - Report pass/fail results.

C) **Add RBAC tests** (20 min)
   - Create `rbac.test.ts` with admin-only, ownership, and access control tests.
   - Run tests and report results.

D) **Do all of the above** (combined, ~40 min)
   - Full setup + verification + tests.

E) **Just continue with audit** (original plan)
   - Skip Docker setup for now and focus on code audit and fixes to `server/`, `profile.ts`, etc.

Which would you like me to do now?

---

## Summary of the faster dev approach
- **Local Supabase in Docker** = safe, fast, full control.
- **Migrations in git** = schema as code; easy to test and revert.
- **Tests run locally** = instant feedback, no network delays.
- **One-time push to production** = low risk; schema is already validated.
- **Reset = fresh state** = no manual cleanup when things get messy.

This is the standard approach used by Supabase and many teams. You stay productive locally, then push to cloud when ready. 🚀
