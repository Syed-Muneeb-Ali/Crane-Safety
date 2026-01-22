# Setup Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
3. **MinIO Server** - [Download](https://min.io/download)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL

1. Create a new database:
```sql
CREATE DATABASE crane_safety;
```

2. Update `.env.local` with your PostgreSQL credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crane_safety
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Set Up MinIO

1. Start MinIO server:
```bash
# Windows
minio server C:\minio-data

# Linux/Mac
minio server ~/minio-data
```

2. Access MinIO Console at http://localhost:9001
   - Default credentials: minioadmin / minioadmin
   - Create a bucket named `crane-images`

3. Update `.env.local` with MinIO settings:
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=crane-images
MINIO_USE_SSL=false
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and update all values:

```bash
cp .env.example .env.local
```

**Important Settings:**
- `JWT_SECRET`: Generate a strong random string for production
- `ALLOWED_IPS`: Add IP addresses of GPU stations that will send events
  - Example: `127.0.0.1,192.168.1.100,10.0.0.0/8`

### 5. Run Database Migration

```bash
npm run db:migrate
```

This creates all necessary tables and indexes.

### 6. Seed Default Users

```bash
npm run db:seed
```

This creates:
- **Admin**: admin@crane.com / admin123
- **Viewer**: viewer@crane.com / viewer123

**⚠️ Change these passwords immediately in production!**

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing Event Ingestion

Use the provided test script or curl:

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-001",
    "event_type": "red",
    "timestamp": "2024-01-15T10:30:00Z",
    "crane_id": "CRANE-001",
    "zone_type": "Red Zone A",
    "motion_type": "CT",
    "operator": "John Doe",
    "ai_confidence_score": 0.95
  }'
```

## Production Deployment

### Windows Server Setup

1. **Install Node.js** on Windows Server
2. **Install PostgreSQL** as a Windows service
3. **Install MinIO** as a Windows service
4. **Build the application:**
   ```bash
   npm run build
   ```
5. **Start production server:**
   ```bash
   npm start
   ```
6. **Set up as Windows Service** (recommended):
   - Use `node-windows` or `pm2-windows-service`
   - Configure to start on boot

### Security Checklist

- [ ] Change default user passwords
- [ ] Set strong JWT_SECRET
- [ ] Configure IP whitelisting (ALLOWED_IPS)
- [ ] Enable SSL for MinIO in production
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Use HTTPS for the web application
- [ ] Review and restrict database user permissions

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check credentials in `.env.local`
- Ensure database exists

### MinIO Connection Issues
- Verify MinIO server is running
- Check bucket exists and is accessible
- Verify credentials in `.env.local`

### IP Whitelisting Not Working
- Check `ALLOWED_IPS` format (comma-separated)
- Verify client IP is being detected correctly
- Check network configuration

### Image Not Displaying
- Verify MinIO bucket policy allows public read
- Check image_reference path in database
- Verify MinIO server is accessible from browser

## Support

For issues or questions, refer to the main README.md or check the codebase documentation.

