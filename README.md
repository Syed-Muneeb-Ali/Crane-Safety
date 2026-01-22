# AI-Based Crane Safety Incident Monitoring System

A centralized on-prem incident monitoring and reporting system for AI-based safety detection deployed on gantry cranes.

## Tech Stack

- **Frontend/Backend**: Next.js 14 with TypeScript
- **Database**: PostgreSQL
- **Object Storage**: File System (dev) or MinIO (production)
- **Styling**: Tailwind CSS
- **Charts**: Recharts

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- MinIO Server (optional, only for production)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

**For Local Development (File System Storage):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crane_safety
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crane_safety
DB_USER=your_user
DB_PASSWORD=your_password

# Storage (File System - No setup required!)
STORAGE_TYPE=filesystem
STORAGE_DIR=./storage/images

# JWT Secret
JWT_SECRET=your-secret-key-change-this-in-production

# API Security
ALLOWED_IPS=127.0.0.1,192.168.1.0/24

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production (MinIO Storage):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crane_safety
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crane_safety
DB_USER=your_user
DB_PASSWORD=your_password

# Storage (MinIO)
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=crane-images
MINIO_USE_SSL=false

# JWT Secret
JWT_SECRET=your-secret-key-change-this-in-production

# API Security
ALLOWED_IPS=127.0.0.1,192.168.1.0/24

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run the migration script to create tables:

```bash
npm run db:migrate
```

Or manually execute the SQL in `database/schema.sql`

### 4. Storage Setup

**Option A: File System (Recommended for Local Development)**
- No additional setup required!
- Just set `STORAGE_TYPE=filesystem` in `.env.local`
- Images will be stored in `./storage/images/` directory (created automatically)

**Option B: MinIO (Recommended for Production)**
1. Start MinIO server
2. Create a bucket named `crane-images` (or update MINIO_BUCKET in .env)
3. Ensure the bucket is publicly readable for image access
4. Set `STORAGE_TYPE=minio` in `.env.local`

See [CONFIGURATION.md](./CONFIGURATION.md) for detailed MinIO setup instructions.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Credentials

- **Admin**: admin@crane.com / admin123
- **Viewer**: viewer@crane.com / viewer123

**Change these immediately in production!**

## API Endpoints

### Event Ingestion
- `POST /api/events` - Ingest safety events from GPU stations

### Events
- `GET /api/events` - List events with filters
- `GET /api/events/[id]` - Get event details

### Analytics
- `GET /api/analytics` - Get analytics data

### Reports
- `POST /api/reports/export` - Export reports (PDF/CSV)

### Images
- `GET /api/images/[key]` - Get image from storage (filesystem or MinIO)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── incidents/         # Incident pages
│   ├── analytics/         # Analytics page
│   └── reports/           # Reports page
├── components/            # React components
├── lib/                   # Utilities and helpers
├── database/              # Database schema and migrations
└── types/                 # TypeScript types
```

## Features

- ✅ Real-time event ingestion
- ✅ IP whitelisting for API security
- ✅ Dashboard with KPIs and charts
- ✅ Incident list with advanced filtering
- ✅ Incident detail view with images
- ✅ Analytics and reporting
- ✅ PDF/CSV export
- ✅ User authentication and role-based access
- ✅ Image storage via File System (dev) or MinIO (production)

## Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Configuration Guide](./CONFIGURATION.md) - PostgreSQL and MinIO setup
- [API Documentation](./API.md) - Complete API reference

## Quick Start

1. Install dependencies: `npm install`
2. Set up environment: Copy `.env.example` to `.env.local` and configure
3. Run migrations: `npm run db:migrate`
4. Seed users: `npm run db:seed`
5. Start dev server: `npm run dev`

For detailed setup instructions, see [SETUP.md](./SETUP.md)

