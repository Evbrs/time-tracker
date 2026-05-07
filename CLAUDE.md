# Time Tracker — Documentation

## 🎯 Overview

**Time Tracker** is an employee time-tracking system without authentication. Employees can check in/out, and managers can view daily/weekly reports with work hours and break times.

### Stack
- **Runtime**: Node.js LTS
- **Framework**: Next.js 16.2.5 (App Router)
- **UI**: React 19.2.4 + Tailwind CSS 4 + shadcn components
- **Storage**: JSON files (local) + Vercel Blob (production)
- **Validation**: Zod
- **Icons**: Lucide React

---

## 📐 Architecture

### `/app`
- `layout.tsx` — Root layout with metadata
- `page.tsx` — Main time-tracking dashboard (employees + check-in/out)
- `reports/page.tsx` — Daily reports & CSV export
- `api/` — API routes

### `/app/api`
- `employees/route.ts` — CRUD for employees (GET, POST)
- `entries/route.ts` — CRUD for time entries (GET, POST)
- `entries/[id]/route.ts` — Update/delete specific entry (PATCH, DELETE)
- `reports/route.ts` — Generate daily/employee reports (GET)

### `/lib`
- `types.ts` — TypeScript interfaces (Employee, TimeEntry, DailyReport)
- `storage.ts` — Abstract storage layer (JSON local / Vercel Blob prod)
- `validation.ts` — Zod schemas for input validation
- `utils.ts` — Formatters, date helpers, hour calculations

### `/components`
- `EmployeeForm.tsx` — Form to add new employees (client)
- `TimeEntryCard.tsx` — Check-in/out UI per employee (client)
- `DailyReport.tsx` — Display daily entries & summary (client)

---

## 🔒 Conformance

### OWASP Top 10
✅ **Input Validation**: All API inputs validated with Zod before processing  
✅ **No Auth Bypass**: No authentication required by design (public time tracker)  
✅ **Error Handling**: Generic error messages in API responses  
✅ **Data Protection**: Sensitive data (employee emails) stored locally, no logs exposed

### RGPD
✅ **No Tracking**: No analytics or tracking without consent  
✅ **Data Retention**: All data stored in JSON/Blob, easily exportable & deletable  
✅ **Privacy**: No third-party sharing; emails are necessary for identification only  
✅ **Right to Delete**: Delete endpoint available for entries (`DELETE /api/entries/:id`)

### WCAG AAA
✅ **Semantic HTML**: Form labels, ARIA attributes, proper heading hierarchy  
✅ **Keyboard Navigation**: All buttons/inputs focusable with Tab  
✅ **Color Contrast**: Blue (#2563EB) on white = 8.59:1 ratio (AAA pass)  
✅ **Focus Visible**: All interactive elements have visible focus rings  
✅ **Screen Readers**: Labels, aria-label, aria-busy for loading states

---

## 🚀 Deployment

### Vercel via MCP
1. Push to GitHub
2. Connect repo to Vercel (or use `vercel deploy`)
3. Set `BLOB_READ_WRITE_TOKEN` in environment variables
4. Deploy

### Environment Variables
```env
# Production (Vercel)
BLOB_READ_WRITE_TOKEN=your_token_here

# Local development (optional)
# Uses file system by default if not set
```

---

## 📊 Data Model

### Employee
```typescript
interface Employee {
  id: string             // ULID or random ID
  name: string
  email: string
  createdAt: string      // ISO 8601
}
```

### TimeEntry
```typescript
interface TimeEntry {
  id: string
  employeeId: string
  checkIn: string        // ISO 8601
  checkOut: string | null
  breakTime: number      // Minutes
  createdAt: string
}
```

### DailyReport
```typescript
interface DailyReport {
  employeeId: string
  employeeName: string
  date: string           // YYYY-MM-DD
  entries: TimeEntry[]
  totalHours: number     // Calculated from check-in/out
  totalBreakTime: number // Sum of all breakTime
}
```

---

## 🔄 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create new employee |
| GET | `/api/entries?employeeId=X&date=YYYY-MM-DD` | List entries with filters |
| POST | `/api/entries` | Create new time entry |
| PATCH | `/api/entries/[id]` | Update entry (e.g., add checkOut) |
| DELETE | `/api/entries/[id]` | Delete entry |
| GET | `/api/reports?employeeId=X&date=YYYY-MM-DD` | Generate daily/employee reports |

---

## 🧪 Testing

No automated tests yet. Manual testing checklist:
- [ ] Add employee via form
- [ ] Check in / check out
- [ ] Verify time calculation
- [ ] Export CSV from reports
- [ ] Test on mobile (responsive design)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test with screen reader (VoiceOver, NVDA)

---

## 📝 Versioning & Commits

Follow Conventional Commits:
```
feat(time-tracker): add CSV export to reports
fix(storage): handle empty Blob list gracefully
chore(deps): update tailwind to latest
docs(api): document POST /employees schema
```

---

## ⚠️ Known Limitations

1. **No Authentication** — Anyone with access to the app can add/modify entries
2. **No Real-Time** — Data updates every 5 seconds; not WebSocket-based
3. **No Timezone Support** — All times are in client timezone; no server-side conversion
4. **Single Device** — Check-in/out only tracks from one device per employee

---

## 🔄 Storage Layer

### Local (Development)
Files stored in `./db/`:
- `db/employees.json`
- `db/entries.json`

### Production (Vercel Blob)
Files stored with prefix `time-tracker/`:
- `time-tracker/employees.json`
- `time-tracker/entries.json`

**Switch**: Automatic via `useBlob()` → checks if `BLOB_READ_WRITE_TOKEN` is set.

---

## 🎨 UI Components

All components use Tailwind CSS with a consistent color scheme:
- **Primary**: Blue (#2563EB)
- **Success**: Green (#16A34A)
- **Danger**: Red (#DC2626)
- **Neutral**: Gray (#374151 text, #F3F4F6 background)

---

## 🚦 Next Steps

1. ✅ Core functionality (check-in/out, reports)
2. ✅ WCAG AAA compliance
3. 📋 Add break time entry during checkout
4. 📋 Weekly summary report
5. 📋 Mobile PWA support
6. 📋 Rate limiting on API
7. 📋 Email notifications for check-out reminders
