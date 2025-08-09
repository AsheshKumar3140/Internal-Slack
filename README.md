# Internal Slack

A Node.js + Express + React app backed by Supabase. It uses Supabase Auth with a custom `public.users` and `public.roles` model, secure Row Level Security (RLS) policies, file uploads to Supabase Storage, and a dark/light glass UI.

## Features

- Authentication with auto-signin after signup (access token only)
- Custom `users` and `roles` tables linked to `auth.users`
- Department + role model (e.g., Techlab, BPO)
- RLS-first backend with two Supabase clients:
  - admin client (service role) for privileged ops
  - per-request user client (anon) for RLS-guarded ops
- Complaints: create with attachments (images/videos) uploaded to Storage
- Team view: shows members in the same department; current user first and tagged “You”
- My Complaints: sorted by priority (Urgent > High > Medium > Low), status & priority badges, expandable content
- Settings: update display name, update password, and theme (Dark/Light)
- Dark and Light themes implemented via CSS variables

## Prerequisites

- Node.js 18+
- Supabase project
- Supabase CLI (optional, for migrations): `npm i -g supabase` (or use `npx supabase`)

## Environment

Create `Backend/.env`:
```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...  # service role key
SUPABASE_ANON_KEY=...          # anon public key
PORT=3000
```

Create `Frontend/.env`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## Install & Run

Backend
```bash
cd Backend
npm install
npm start
# http://localhost:3000
```

Frontend
```bash
cd Frontend
npm install
npm run dev
# http://localhost:5173
```

## Database setup

We use a migration to create a helper `exec_sql` function, then tables/policies are created idempotently on demand.

Link CLI and push the migration containing `exec_sql`:
```bash
cd Backend
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

On first run the app executes:
- `Backend/models/roles.js` → `public.roles`
- `Backend/models/users.js` → `public.users`
- `Backend/models/complaints.js` → `public.complaints` + `updated_at` trigger
- `Backend/models/security.js` → SECURITY DEFINER helpers + RLS policies

### Optional: add preferences column (for theme)
If you see “Could not find the 'preferences' column of 'users'” when saving theme, run this once in Supabase SQL editor:
```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
```

## Data model

Roles (`public.roles`)
```sql
id uuid pk, role_name text, department_name text, created_at timestamptz, unique(role_name, department_name)
```

Users (`public.users`)
```sql
id uuid pk, auth_user_id uuid -> auth.users(id), email text unique, name text,
role_id uuid -> public.roles(id), is_active boolean default true,
(created_at, updated_at timestamps)
-- optionally: preferences jsonb default '{}'
```

Complaints (`public.complaints`)
```sql
id uuid pk, user_id uuid -> public.users(id) on delete set null,
role_id uuid -> public.roles(id) on delete set null,
department_name text, category text, priority text check in ('Low','Medium','High','Urgent') default 'Medium',
subject text, description text,
attachments_urls jsonb default '[]',
is_anonymous boolean default false,
status text check in ('open','in_progress','resolved','closed') default 'open',
assigned_to uuid -> public.users(id) on delete set null,
(created_at, updated_at timestamps)
```

## RLS and security

- Two clients (Backend/config/supabase.js):
  - `supabase` (service role): NEVER call signIn/signOut; used for DDL, Storage bucket mgmt, admin auth APIs, and trusted system ops.
  - `createUserClient(token?)` (anon): short-lived client per request; pass the user access token so queries run under RLS.

- SECURITY DEFINER helpers (in `models/security.js`):
  - `current_user_public_id()` → maps `auth.uid()` to `public.users.id`
  - `current_user_role_and_dept()` → returns role id/name and department for the current user

- Policies (idempotently created):
  - users: `users_select_self` (read own row)
  - roles: `roles_select_all` (read roles)
  - complaints: `complaints_select_all` (read all signed-in), `complaints_insert_by_role_and_dept` (insert allowed if caller’s role in `('Employee','Manager')` and department matches and `user_id` is caller)

## Storage

- Bucket: `complaints` (public). Auto-created on first upload.
- Upload path: `complaints/{complaint_id}/{filename}`.
- Allowed: images/videos. Client enforces up to 5 files, max 10MB each; server bucket limit is 20MB per file.

## API

Auth (`Backend/routes/authRoutes.js`)
- POST `/api/auth/signup` → creates `auth.users`, upserts role, inserts `public.users`, auto-signs in; returns `{ user, access_token }`
- POST `/api/auth/signin` → signs in and returns `{ user, access_token }`
- POST `/api/auth/signout` → client clears token
- GET `/api/auth/me` → current user details (requires Bearer token)

Complaints (`Backend/routes/complaintRoutes.js`)
- GET `/api/complaints` → list complaints (signed-in)
- GET `/api/complaints/mine` → list complaints for the authenticated user
- POST `/api/complaints` → create complaint with multipart `attachments` (auth required)
  - Uploads with admin client → gets public URLs
  - Inserts via per-request user client (RLS enforced)

Team (`Backend/routes/teamRoutes.js`)
- GET `/api/team` → current user’s department members only; filters by department roles and `is_active=true`

Profile (`Backend/routes/profileRoutes.js`)
- PUT `/api/profile/name` → update display name in `public.users`
- PUT `/api/profile/password` → update password via admin API
- PUT `/api/profile/preferences` → update `preferences.theme` (`dark`/`light`)

Roles (`Backend/routes/authRoutes.js`)
- GET `/api/auth/roles/:department` → list roles by department

## Frontend

- Routing (`Frontend/src/App.jsx`):
  - `/` → `Auth` (defaults to Sign In when unauthenticated)
  - `/home` → dashboard
  - `/complaint` → complaint form (protected)
  - `/team` → team list (protected)
  - `/my-complaints` → user’s complaints (protected)
  - `/settings` → profile settings (protected)

- Auth UI:
  - In-app success/error banners using `.success-message` / `.error-message`
  - After successful signin/signup, a brief success message shows then auto-redirects

- Home (`Frontend/src/components/Home.jsx`):
  - Quick actions: Make Complaint, View Team, My Complaints, Settings

- Team (`Frontend/src/components/Team.jsx`):
  - Department label, members list, current user highlighted with “You”, current user shown first

- My Complaints (`Frontend/src/components/MyComplaints.jsx`):
  - Click to expand and view description
  - Status badge (top-right), colored priority badge, sorted by priority desc

- Complaint (`Frontend/src/components/Complaint.jsx`):
  - Department auto-selected from the logged-in user and disabled
  - Category by department, priority, subject, description
  - File uploads (images/videos) with validation; shows selected list; success banner on submit

- Settings (`Frontend/src/components/Settings.jsx`):
  - Update display name
  - Update password
  - Switch theme (Dark/Light). Applies via `document.documentElement.dataset.theme`

- Styles: `Frontend/src/CSS/variables.css`, `Auth.css`, `Home.css`
  - Light theme is deliberately dimmed to reduce glare; adjust via `[data-theme="light"]` variables if desired

## Troubleshooting

- CORS: backend enables CORS for `http://localhost:5173`
- Missing `exec_sql`: link project and `supabase db push`
- “Auth session missing!” on password update: backend uses admin API; ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- “Could not find the 'preferences' column of 'users'”: run the `ALTER TABLE` snippet in Database setup
- 404 on auth routes: ensure backend is running and routes mounted under `/api/*`
- Tokens not set: frontend saves `access_token` in `localStorage`; ensure you’re not in private mode clearing it

---

Built with Node.js, Express, React, and Supabase. Dark + dim light themes, glass UI, and clear separation of admin vs user-scoped operations.
