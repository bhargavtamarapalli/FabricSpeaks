---
description: Deploying Admin Analytics and Security Updates
---

# Deployment Steps

1.  **Database Migration**:
    - Ensure the `audit_logs` table is created. Run `npx drizzle-kit push` or equivalent migration command.
    - Verify `shared/schema.ts` matches the database.

2.  **Environment Variables**:
    - Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set.
    - Ensure `JWT_SECRET` is set for auth.

3.  **Build**:
    - Run `npm run build` to verify the build.

4.  **Restart Server**:
    - Restart the Node.js server to apply changes in `server/index.ts` (socket.io) and new routes.
    - **Note**: The server is configured to run on port **5001** (updated in `.env.local`) to avoid conflicts with other applications.

5.  **Verification**:
    - Log in as admin at `http://localhost:5001/admin`.
    - Navigate to `/admin/analytics`.
    - Check if charts load.
    - Perform an action (e.g., update product) and check `audit_logs` table.
