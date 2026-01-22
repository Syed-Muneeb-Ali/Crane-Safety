# PostgreSQL and MinIO Configuration Guide

## PostgreSQL Setup

### 1. Install PostgreSQL

**Option A: Official Installer**
1. Download PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer
3. During installation:
   - Choose installation directory (default: `C:\Program Files\PostgreSQL\16`)
   - Set a **master password** for the `postgres` superuser (remember this!)
   - Default port: `5432` (keep this unless you have conflicts)
   - Choose locale (default is fine)

**Option B: Using Chocolatey (if installed)**
```powershell
choco install postgresql
```

### 2. Verify Installation

Open PowerShell and test the connection:
```powershell
# Navigate to PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\16\bin"

# Test connection (will prompt for password)
.\psql.exe -U postgres
```

If successful, you'll see the PostgreSQL prompt. Type `\q` to exit.

### 3. Create Database

**Using psql (Command Line):**
```powershell
# Connect to PostgreSQL
.\psql.exe -U postgres

# Create database
CREATE DATABASE crane_safety;

# Create a dedicated user (optional but recommended)
CREATE USER crane_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE crane_safety TO crane_user;

# Exit
\q
```

**Using pgAdmin (GUI):**
1. Open pgAdmin 4 (installed with PostgreSQL)
2. Connect to your PostgreSQL server (use the master password)
3. Right-click "Databases" → "Create" → "Database"
4. Name: `crane_safety`
5. Click "Save"

### 4. Update Environment Variables

In your `.env.local` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crane_safety
DB_USER=postgres          # or crane_user if you created one
DB_PASSWORD=your_password # The password you set
```

### 5. Test Connection

Run the migration to test:
```powershell
npm run db:migrate
```

If successful, you'll see: "Database migration completed successfully!"

---

## Storage Configuration

The application supports two storage backends for images:

1. **File System** (Recommended for local development/testing)
   - No additional setup required
   - Images stored in local directory
   - Lower resource usage, perfect for low-spec PCs

2. **MinIO** (Recommended for production)
   - Object storage server
   - Better for production deployments
   - Scalable and feature-rich

### Choosing Storage Type

Set the `STORAGE_TYPE` environment variable in your `.env.local`:

**For Local Development (File System):**
```env
STORAGE_TYPE=filesystem
STORAGE_DIR=./storage/images  # Optional: defaults to ./storage/images
```

**For Production (MinIO):**
```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=crane-images
MINIO_USE_SSL=false
```

### File System Setup (Local Development)

**No installation required!** Just set the environment variable:

1. In your `.env.local` file, add:
```env
STORAGE_TYPE=filesystem
STORAGE_DIR=./storage/images
```

2. The storage directory will be created automatically when you first upload an image.

3. Images will be stored in: `{project-root}/storage/images/`

4. Images are served via the `/api/images/[key]` endpoint automatically.

**That's it!** No additional setup needed for file system storage.

---

## MinIO Setup (Production)

### 1. Install MinIO

**Option A: Download Binary**
1. Download MinIO for Windows from [https://min.io/download](https://min.io/download)
2. Extract to a folder (e.g., `C:\minio`)
3. Rename `minio.exe` if needed

**Option B: Using Chocolatey**
```powershell
choco install minio
```

**Option C: Using Scoop**
```powershell
scoop install minio
```

### 2. Create Data Directory

Create a folder to store MinIO data:
```powershell
# Create directory
mkdir C:\minio-data
```

### 3. Start MinIO Server

**Option A: Command Line (Manual)**
```powershell
# Navigate to MinIO directory
cd C:\minio

# Start MinIO server
.\minio.exe server C:\minio-data
```

You'll see output like:
```
MinIO Object Storage Server
Copyright: 2015-2024 MinIO, Inc.
License: GNU AGPLv3 <https://www.gnu.org/licenses/agpl-3.0.html>
Version: RELEASE.2024-01-16T16-07-38Z (go1.21.6)

API: http://127.0.0.1:9000  http://192.168.1.100:9000
RootUser: minioadmin
RootPass: minioadmin

Console: http://127.0.0.1:9001 http://192.168.1.100:9001
```

**Note the credentials!** Default is `minioadmin` / `minioadmin`

**Option B: PowerShell Script (Auto-start)**

Create `start-minio.ps1`:
```powershell
# start-minio.ps1
$minioPath = "C:\minio\minio.exe"
$dataPath = "C:\minio-data"

Start-Process -FilePath $minioPath -ArgumentList "server", $dataPath -WindowStyle Normal
```

Run it:
```powershell
.\start-minio.ps1
```

**Option C: Windows Service (Production)**

For production, install as a Windows service using NSSM:
```powershell
# Install NSSM
choco install nssm

# Create service
nssm install MinIO "C:\minio\minio.exe" "server C:\minio-data"
nssm set MinIO AppEnvironmentExtra "MINIO_ROOT_USER=minioadmin" "MINIO_ROOT_PASSWORD=your_secure_password"
nssm start MinIO
```

### 4. Access MinIO Console

1. Open browser: [http://localhost:9001](http://localhost:9001)
2. Login with:
   - **Access Key**: `minioadmin`
   - **Secret Key**: `minioadmin`

### 5. Create Bucket

**Using Web Console:**
1. Click "Buckets" in left sidebar
2. Click "Create Bucket"
3. Name: `crane-images`
4. Click "Create Bucket"

**Using MinIO Client (mc):**
```powershell
# Download mc.exe from https://min.io/docs/minio/linux/reference/minio-mc.html
# Or install via Chocolatey: choco install minio-client

# Configure alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
mc mb local/crane-images

# Set public read policy (for image access)
mc anonymous set download local/crane-images
```

**Using PowerShell/API:**
```powershell
# Install MinIO .NET SDK or use REST API
# For now, use the web console or mc client
```

### 6. Set Bucket Policy (Public Read)

**Using Web Console:**
1. Go to Buckets → `crane-images`
2. Click "Access Policy"
3. Select "Public" or "Custom Policy"
4. For custom, use:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::crane-images/*"]
    }
  ]
}
```

**Using mc client:**
```powershell
mc anonymous set download local/crane-images
```

### 7. Update Environment Variables

In your `.env.local` file:
```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=crane-images
MINIO_USE_SSL=false
```

**Note:** Make sure to set `STORAGE_TYPE=minio` to use MinIO instead of file system storage.

### 8. Change Default Credentials (Production)

**Important:** Change default MinIO credentials for production!

**Option A: Environment Variables**
```powershell
# Set environment variables before starting
$env:MINIO_ROOT_USER="your_secure_username"
$env:MINIO_ROOT_PASSWORD="your_secure_password"

# Then start MinIO
.\minio.exe server C:\minio-data
```

**Option B: Configuration File**
Create `C:\minio\config.json`:
```json
{
  "credential": {
    "accessKey": "your_secure_username",
    "secretKey": "your_secure_password"
  }
}
```

Update `.env.local` with new credentials.

---

## Verification Steps

### Test PostgreSQL Connection

```powershell
# Test from Node.js
node -e "const { Pool } = require('pg'); const p = new Pool({host:'localhost',port:5432,database:'crane_safety',user:'postgres',password:'your_password'}); p.query('SELECT NOW()').then(r=>console.log('Connected!',r.rows[0])).catch(e=>console.error('Error:',e.message));"
```

### Test MinIO Connection

```powershell
# Test from Node.js
node -e "const { Client } = require('minio'); const mc = new Client({endPoint:'localhost',port:9000,useSSL:false,accessKey:'minioadmin',secretKey:'minioadmin'}); mc.bucketExists('crane-images').then(r=>console.log('Bucket exists:',r)).catch(e=>console.error('Error:',e.message));"
```

### Test Application Connection

1. Start your application:
```powershell
npm run dev
```

2. Check console for connection messages:
   - Should see "Database connected"
   - No MinIO connection errors

3. Try uploading a test event:
```powershell
node scripts/test-event-api.js
```

---

## Troubleshooting

### PostgreSQL Issues

**"Connection refused"**
- Check if PostgreSQL service is running:
  ```powershell
  Get-Service postgresql*
  ```
- Start service if stopped:
  ```powershell
  Start-Service postgresql-x64-16
  ```

**"Authentication failed"**
- Verify password in `.env.local`
- Reset password if needed:
  ```sql
  ALTER USER postgres WITH PASSWORD 'new_password';
  ```

**"Database does not exist"**
- Create database (see step 3 above)

### MinIO Issues

**"Connection refused"**
- Check if MinIO is running (check port 9000)
- Verify firewall allows port 9000 and 9001

**"Bucket does not exist"**
- Create bucket `crane-images` (see step 5 above)

**"Access Denied"**
- Verify credentials in `.env.local`
- Check bucket policy allows public read

**"Cannot upload images"**
- Verify bucket exists
- Check bucket policy
- Verify MinIO server is accessible

### Port Conflicts

If ports 5432 (PostgreSQL) or 9000/9001 (MinIO) are in use:

**PostgreSQL:**
- Change port in `postgresql.conf`
- Update `DB_PORT` in `.env.local`

**MinIO:**
- Start with custom port:
  ```powershell
  .\minio.exe server C:\minio-data --address ":9002"
  ```
- Update `MINIO_PORT` in `.env.local`

---

## Production Recommendations

### PostgreSQL
- [ ] Change default `postgres` user password
- [ ] Create dedicated database user with limited privileges
- [ ] Enable SSL connections
- [ ] Set up automated backups
- [ ] Configure connection pooling limits
- [ ] Monitor database performance

### MinIO
- [ ] Change default `minioadmin` credentials
- [ ] Enable SSL/TLS
- [ ] Set up access policies properly
- [ ] Configure bucket versioning (optional)
- [ ] Set up lifecycle policies for old images
- [ ] Monitor storage usage
- [ ] Consider MinIO distributed mode for high availability

### Security
- [ ] Use strong passwords
- [ ] Restrict network access (firewall rules)
- [ ] Enable SSL for both services
- [ ] Regular security updates
- [ ] Monitor access logs

---

## Quick Reference

### PostgreSQL Commands
```powershell
# Start service
Start-Service postgresql-x64-16

# Stop service
Stop-Service postgresql-x64-16

# Connect via psql
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d crane_safety

# Backup database
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres crane_safety > backup.sql
```

### MinIO Commands
```powershell
# Start MinIO
.\minio.exe server C:\minio-data

# Check status (via browser)
# http://localhost:9001
```

### Environment Variables Template

**For Local Development (File System):**
```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crane_safety
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Storage (File System)
STORAGE_TYPE=filesystem
STORAGE_DIR=./storage/images
```

**For Production (MinIO):**
```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crane_safety
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Storage (MinIO)
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=crane-images
MINIO_USE_SSL=false
```

