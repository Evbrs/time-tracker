# Mes Heures - Documentation

## Overview

**Mes Heures** is an employee-centric time tracking platform for French workers. Employees can log their daily work hours, specify their contract type (35h, 39h, or custom), and get detailed statistics comparing actual worked hours vs. contract hours.

### Stack
- **Runtime**: Node.js LTS
- **Framework**: Next.js 16.2.5 (App Router)
- **UI**: React 19.2.4 + Tailwind CSS 4
- **Storage**: JSON files (local) + Vercel Blob (production)
- **Validation**: Zod
- **Icons**: Lucide React

---

## Architecture

### `/app`
- `layout.tsx` — Root layout (French locale)
- `page.tsx` — Main page: profile selection + daily hour entry + recent entries
- `stats/page.tsx` — Statistics with flexible date ranges

### `/app/api`
- `employees/route.ts` — Employee CRUD (GET, POST)
- `workdays/route.ts` — Work day entries CRUD (GET, POST)
- `workdays/[id]/route.ts` — Update/delete specific entry (PATCH, DELETE)
- `stats/route.ts` — Period statistics with contract comparison (GET)

### `/lib`
- `types.ts` — TypeScript interfaces (Employee, WorkDay, PeriodStats)
- `storage.ts` — Abstract storage layer (JSON local / Vercel Blob prod)
- `validation.ts` — Zod schemas
- `utils.ts` — Date helpers, hour calculations, formatting, stats engine

---

## Data Model

### Employee
```typescript
interface Employee {
  id: string
  name: string
  contractHours: number  // 35, 39, or custom
  createdAt: string
}
```

### WorkDay
```typescript
interface WorkDay {
  id: string
  employeeId: string
  date: string        // YYYY-MM-DD
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  breakMinutes: number
  notes: string
  createdAt: string
}
```

### PeriodStats
```typescript
interface PeriodStats {
  totalWorkedHours: number
  totalContractHours: number
  diffHours: number
  avgDailyHours: number
  minDailyHours: number
  maxDailyHours: number
  totalDays: number
  totalWorkingDays: number
  avgBreakMinutes: number
  entries: WorkDay[]
}
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create new employee (name, contractHours) |
| GET | `/api/workdays?employeeId=X&date=Y&startDate=S&endDate=E` | List entries with filters |
| POST | `/api/workdays` | Create new work day entry |
| PATCH | `/api/workdays/[id]` | Update entry |
| DELETE | `/api/workdays/[id]` | Delete entry |
| GET | `/api/stats?employeeId=X&startDate=S&endDate=E` | Period statistics |

---

## Storage Layer

### Local (Development)
Files stored in `./db/`:
- `db/employees.json`
- `db/workdays.json`

### Production (Vercel Blob)
Uses `list()` + `fetch(downloadUrl)` pattern (not `head()`).
Files stored with prefix `time-tracker/`:
- `time-tracker/employees.json`
- `time-tracker/workdays.json`

### Environment Variables
```env
BLOB_READ_WRITE_TOKEN=your_token_here
```

---

## Deployment

Push to GitHub and deploy via Vercel CLI or automatic GitHub integration.
Ensure `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables.
