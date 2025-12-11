# Supabase Audit & RBAC Plan

Date: 2025-11-11

## One-line summary
Audit of server routes, middleware, DB repositories, shared schema, and Supabase artifacts to verify: admin writes persist to the same Supabase tables users read; identify migration/config mismatches; produce a prioritized, safe plan to fix issues and add RBAC tests.

## High-level findings
- Admin endpoints (create/update/delete products, create categories) are implemented and call repository methods that persist to `products`/`categories` tables.
- Public product endpoints (`GET /api/products`, `GET /api/products/:id`) read from the same `products` table via repository -> reads should reflect admin writes assuming the DB schema/migrations in use match `shared/schema.ts`.
- Migration mismatch: canonical migration SQL files (including versions 20251101182524, 20251101183907, 20251101183938, 20251101184022) exist at:
  - `C:\Bhargav\FabricSpeaks\supabase\migrations`
  but the folder where `npx supabase db push` was run (`C:\Bhargav\FabricSpeaks\Fabric Speaks\supabase\migrations`) contains a different, smaller set of migration files. This explains the CLI error about missing remote migration versions.
- I applied a small hardening: `POST /api/admin-notify` now requires `requireAdmin`.
- Profile updates via `updateMeHandler` currently do not persist to DB — phone is stored in-memory in the profile object for MVP only.
- Repositories use Drizzle and the typed `shared/schema.ts`. Repos enforce ownership where needed (addresses, cart items) and perform input whitelisting/validation in many places.

## Files reviewed (first-pass)
- `server/routes.ts` — routes wired; admin endpoints use `requireAdmin` (except `admin-notify` which is now protected).
- `server/middleware/auth.ts` — `requireAuth`, `requireAdmin`, `requireUser` implemented using Supabase auth + profile lookup in `profiles` table.
- `server/admin.ts` — admin handlers call `SupabaseProductsRepository` and `SupabaseCategoriesRepository`.
- `server/products.ts` — public product list/get handlers calling repo.
- `server/profile.ts` — `getMe` and `updateMe` (in-memory for phone); address endpoints use repository that enforces ownership.
- `server/db/repositories/*` — `supabase-products.ts`, `supabase-categories.ts`, `supabase-users.ts`, `supabase-addresses.ts`, etc. (Drizzle queries; validation with Zod in places).
- `shared/schema.ts` — full typed DB schema; canonical contract between code and DB.
- `supabase/config.toml` — found at `Fabric Speaks Admin/supabase/config.toml`.
- `supabase/migrations` — two places in repo with differing contents (see Migration mismatch above).

## Observations and small issues to fix
- Migration/project directory mismatch (critical): CLI uses the local `supabase` folder where it runs. There are two `supabase` folders with different migration histories; pick a canonical one and sync.
- `updateMeHandler` does not persist user changes (phone) to the `profiles` table; likely intentional for MVP but should be persisted eventually.
- Some repositories expect an injected `db` while others import `db` directly; standardize DI or singletons to avoid mistakes in production vs test.
- Tests exist for many server endpoints — add RBAC-focused tests (admin vs non-admin) and ownership tests for user-only endpoints.
- Consider adding audit logs for admin actions (who/when/what) and prevent users from updating `role` in `profiles` unless admin.

## Priority plan (ordered)
1. Critical — Resolve Supabase migrations / project directory mismatch
   - Decide canonical `supabase` project folder (root `C:\Bhargav\FabricSpeaks\supabase` or `C:\Bhargav\FabricSpeaks\Fabric Speaks\supabase`).
   - Preferred flow: run `supabase db pull` from the folder that represents the remote project to fetch remote migrations/schema into that folder (non-destructive). Then copy/commit the files into the app folder you use for CLI pushes.
   - Quick alternative: copy the missing migration files into the `supabase/migrations` folder you run `db push` from (fast, local fix).

2. High — RBAC correctness & tests
   - Add automated tests proving admin-only endpoints return 403 for non-admin and 200 for admin.
   - Add ownership tests: users can only modify their own addresses/profile.
   - Harden any remaining open admin endpoints (done: `admin-notify`).

3. Medium — Persist profile updates & standardize DI
   - Make `updateMeHandler` persist allowed profile fields to `profiles` table via `SupabaseUsersRepository.updateProfile`.
   - Ensure `SupabaseUsersRepository` is constructed/used consistently (inject `db` or import singleton), adjust tests accordingly.

4. Low — Polishing
   - Add audit logging for admin writes, add schema/migration checks in CI, consider caching product listing.

5. Tests & verification
   - Run full test suite and iterate on failures (up to 3 targeted fixes).

## Immediate next actionable options (pick one)
A) Sync properly via `supabase db pull` (preferred, safe)
   - Steps (PowerShell):

```powershell
# move to canonical supabase folder (example: root)
cd "C:/Bhargav/FabricSpeaks/supabase"
# fetch remote schema and produce local migrations non-destructively
npx supabase db pull
# Inspect created/updated files, then commit them
git status
git add supabase/migrations && git commit -m "Sync migrations from remote"
```

B) Quick local copy of migration files (fast)

```powershell
# copy the 4 migration files into the Fabric Speaks supabase migrations folder
Copy-Item "C:/Bhargav/FabricSpeaks/supabase/migrations/20251101182524_unified_schema_additions.sql" "C:/Bhargav/FabricSpeaks/Fabric Speaks/supabase/migrations/"
Copy-Item "C:/Bhargav/FabricSpeaks/supabase/migrations/20251101183907_phase1_schema_final.sql" "C:/Bhargav/FabricSpeaks/Fabric Speaks/supabase/migrations/"
Copy-Item "C:/Bhargav/FabricSpeaks/supabase/migrations/20251101183938_phase1_schema_final.sql" "C:/Bhargav/FabricSpeaks/Fabric Speaks/supabase/migrations/"
Copy-Item "C:/Bhargav/FabricSpeaks/supabase/migrations/20251101184022_phase1_schema_final.sql" "C:/Bhargav/FabricSpeaks/Fabric Speaks/supabase/migrations/"
# then run the push from the Fabric Speaks folder
cd "C:/Bhargav/FabricSpeaks/Fabric Speaks"
npx supabase db push
```

C) Start implementing RBAC tests & code fixes
   - Add unit/integration tests that assert admin-only access and ownership. Implement `updateMeHandler` persistence.

D) Full per-file, line-by-line audit and fix cycle (longer)

## Safety notes
- Avoid `supabase migration repair` until you have verified migration files and have DB backups. The `repair` command mutates migration_history and can break the remote DB state if used incorrectly.
- Prefer `db pull` (non-destructive) to align local migrations with remote.

## Proposed immediate action
If you don't care which folder is canonical, I will treat the root `C:\Bhargav\FabricSpeaks\supabase` as canonical and run Option A (pull there) to sync migrations, then copy any needed files to `Fabric Speaks/supabase` and re-run `npx supabase db push` from that folder.

---

If you want me to proceed, reply with which option (A/B/C/D) to execute and confirm whether to treat `C:\Bhargav\FabricSpeaks\supabase` as the canonical Supabase project folder (or specify another). If you prefer, I can start by adding RBAC tests instead (Option C).
