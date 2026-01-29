# Deploy Crane Safety on Vercel with Supabase

Step-by-step guide to deploy the app on Vercel, use Supabase as the database, and copy your existing data.

---

## Prerequisites

- Git repo of this project (e.g. on GitHub)
- Local PostgreSQL with existing data (your current setup)
- Accounts: [Vercel](https://vercel.com), [Supabase](https://supabase.com)

---

## Part 1: Supabase (Database)

### Step 1: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose your **Organization**, set **Name** (e.g. `crane-safety`), set a strong **Database password** (save it).
4. Pick a **Region** close to your users.
5. Click **Create new project** and wait until the project is ready.

### Step 2: Get the database connection string

1. In the Supabase dashboard, open **Project Settings** (gear icon) → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the connection string. It looks like:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password you set.
5. For **Vercel (serverless)**, use the **Transaction** pooler (port **6543**).  
   If you see **Session** (port 5432), switch to **Transaction** and use the URI with port **6543**.

Save this as `DATABASE_URL`; you’ll use it locally and in Vercel.

### Step 3: Run schema and seed on Supabase (from your PC)

From your project root, with Supabase URL and no other DB vars:

1. Create a `.env.supabase` (or use `.env`) with only:
   ```env
   DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
2. Run migration (creates tables and default shifts):
   ```powershell
   $env:DATABASE_URL="postgresql://postgres.xxx:yyy@aws-0-xx.pooler.supabase.com:6543/postgres"; node scripts/migrate.js
   ```
3. Seed default users:
   ```powershell
   $env:DATABASE_URL="postgresql://..."; node scripts/seed-users.js
   ```
   Default logins: **admin** / **admin123**, **viewer** / **viewer123**.

---

## Part 2: Copy existing data into Supabase

Use this to move data from your current PostgreSQL into Supabase.

### Step 2.1: Export data from your local database

Using `pg_dump` (e.g. from PostgreSQL bin or full path):

```powershell
# Optional: set env so you don't type password
$env:PGPASSWORD="your_local_db_password"

# Data-only dump (no schema). Use your actual DB name/user/host.
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h localhost -d crane_safety --data-only --column-inserts -f backup-data.sql
```

- If PostgreSQL bin is not in PATH, use the full path to `pg_dump.exe` (e.g. `C:\Program Files\PostgreSQL\16\bin\pg_dump.exe`).
- This creates `backup-data.sql` with `INSERT` statements for all tables.

### Step 2.2: Clean the dump (optional but recommended)

Open `backup-data.sql` and:

1. Remove any `INSERT` into `users` if you want to keep only the seeded users (admin/viewer).  
   Or keep your own users and remove the seed step for users.
2. Ensure order of tables respects foreign keys: e.g. **shifts** before **events** (events reference shifts).  
   If your dump has a different order, reorder or run in multiple steps.

### Step 2.3: Import into Supabase

**Option A – Supabase SQL Editor (small datasets)**

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the contents of `backup-data.sql` (or a part of it if it’s large).
3. Run the query.  
   If you get “relation does not exist”, run the migration first (Step 1.3).  
   If you get duplicate key errors, remove or adjust conflicting rows (e.g. default shifts already inserted by migration).

**Option B – psql (any size)**

1. Install [psql](https://www.postgresql.org/download/) if needed.
2. Use the **Direct connection** string from Supabase (Settings → Database), e.g.:
   ```text
   postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres
   ```
3. Run:
   ```powershell
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" "postgresql://postgres:YOUR_PASSWORD@db.xxxx.supabase.co:5432/postgres" -f backup-data.sql
   ```

After this, your Supabase database has the schema and your data.

---

## Part 3: Storage (images) on Vercel

On Vercel the filesystem is read-only. You cannot use `STORAGE_TYPE=filesystem` in production.

- **Option A – MinIO (or any S3-compatible service)**  
  - Deploy MinIO (e.g. on a VPS, or use a hosted S3-compatible service).  
  - In Vercel, set:
    - `STORAGE_TYPE=minio`
    - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_USE_SSL`  
  - Upload existing images from `storage/images` into that bucket (e.g. with MinIO client or your own script).

- **Option B – Supabase Storage**  
  - You can add a Supabase Storage bucket later and change the app to use it; the app currently supports filesystem and MinIO.  
  - For a quick deploy, use MinIO or leave image upload disabled until you integrate Supabase Storage.

---

## Part 4: Deploy on Vercel

### Step 4.1: Push code and import project

1. Push your project to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
3. Import the repo and leave **Framework Preset** as Next.js.  
   Root directory: project root (where `package.json` and `next.config.js` are).

### Step 4.2: Environment variables

In Vercel: **Project → Settings → Environment Variables**. Add:

| Name | Value | Notes |
|------|--------|------|
| `DATABASE_URL` | Your Supabase **Transaction** pooler URI (port 6543) | Required |
| `JWT_SECRET` | Long random string (e.g. `openssl rand -hex 32`) | Required for auth |
| `STORAGE_TYPE` | `minio` | Required on Vercel (not `filesystem`) |
| `MINIO_ENDPOINT` | Your MinIO host (e.g. `minio.yourdomain.com`) | If using MinIO |
| `MINIO_PORT` | `443` or `9000` | If using MinIO |
| `MINIO_ACCESS_KEY` | MinIO access key | If using MinIO |
| `MINIO_SECRET_KEY` | MinIO secret key | If using MinIO |
| `MINIO_BUCKET` | `crane-images` | If using MinIO |
| `MINIO_USE_SSL` | `true` if HTTPS | If using MinIO |

Do **not** set `DB_SSL=false` unless you have a specific reason; Supabase expects SSL.

### Step 4.3: Deploy

1. Click **Deploy** (or push to the connected branch to trigger a new deploy).
2. After the build, open the generated URL (e.g. `https://your-project.vercel.app`).
3. Log in with **admin** / **admin123** (or your own users if you migrated them).

---

## Part 5: Post-deploy checklist

- [ ] Supabase project created and **Transaction** pooler URL (port 6543) used in `DATABASE_URL`.
- [ ] Schema applied on Supabase (`node scripts/migrate.js` with `DATABASE_URL`).
- [ ] Default users seeded (`node scripts/seed-users.js`).
- [ ] Local data exported (`pg_dump --data-only --column-inserts`) and imported into Supabase (SQL Editor or psql).
- [ ] Storage: MinIO (or other) configured and `STORAGE_*` / `MINIO_*` set on Vercel; existing images uploaded to the bucket.
- [ ] Vercel env vars set: `DATABASE_URL`, `JWT_SECRET`, and storage-related vars.
- [ ] Login and main flows tested on the Vercel URL.

---

## Quick reference

**Run migration against Supabase (local):**
```powershell
$env:DATABASE_URL="postgresql://postgres.xxx:yyy@aws-0-xx.pooler.supabase.com:6543/postgres"; node scripts/migrate.js
```

**Seed users (local, same DATABASE_URL):**
```powershell
$env:DATABASE_URL="..."; node scripts/seed-users.js
```

**Export local DB data:**
```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h localhost -d crane_safety --data-only --column-inserts -f backup-data.sql
```

**Default logins after seed:** admin / admin123, viewer / viewer123. Change passwords after first login in production.
