# Brick x Brick

**Construction Management System for Small Contractors**

> Stop losing material requests in Messenger and tracking expenses with handwritten notes. Brick x Brick digitizes your entire construction workflow—from project planning to expense approval—with a web and mobile app designed specifically for micro-construction teams.

**Developed by:** FourLoop() — Cebu Technological University  
**Pilot Partner:** JJC-R Blueprints and Drafting Services

---

## What It Does

### The Problem
Small construction firms run on informal systems:
- Material requests disappear in Messenger group chats
- Expense receipts get lost or mixed up
- No one knows project progress until the Site Manager shows up
- Financial records are scattered across files and notebooks
- Zero accountability trail for audits

### The Solution
Brick x Brick replaces that chaos with a simple, structured digital workflow:

| Workflow | What Happens |
|----------|---|
| **Material Requests** | Site Manager submits → Purchaser approves → order tracked from request to delivery |
| **Work Tracking** | Daily progress logged with labor costs attached to each task |
| **Expenses** | Receipts photo-attached and approved by Accountant with full trail |
| **Full Audit Log** | Every change recorded—who did it, when, and what changed |

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Git

### Installation (5 minutes)

```bash
# 1. Clone the project
git clone https://github.com/Cache-jujan/BrickByBrick.git
cd BrickByBrick

# 2. Set up database
psql -U postgres -c "CREATE DATABASE brickxbrick;"

# 3. Install all dependencies
npm run setup

# 4. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your database password

# 5. Run migrations
cd backend
npx prisma migrate dev --name init
```

### Run the System

Open three terminals:

```bash
# Terminal 1: Backend API
cd backend && npm run dev
# Runs on http://localhost:3000

# Terminal 2: Web Application  
cd web && npm run dev
# Runs on http://localhost:5173

# Terminal 3: Mobile App
cd mobile && npx expo start
# Scan QR with Expo Go on your phone
```

---

## Key Features

### Role-Based Access
Each user has one role with specific permissions:

- **Admin** — Create projects, manage team members, view audit logs
- **Site Manager** — Submit material requests, log daily work progress
- **Purchaser** — Update request status, submit expenses with receipts
- **Accountant** — Approve/reject expenses, review audit trail

### Material Request Workflow
```
Site Manager submits request
          ↓
    Purchaser reviews
          ↓
     Status flow:
     PENDING → APPROVED → PURCHASED → DELIVERED
```

### Digital Expense Tracking
- Attach receipt photos
- Track Official Receipt (OR) numbers
- Accountant approval required
- Full change history

### Complete Audit Trail
- Every action recorded with timestamp and user
- View who changed what and when
- Financial accountability built-in

---

## File Structure

```
backend/          → Express API + Prisma ORM
web/              → React dashboard 
mobile/           → Expo React Native app
├── src/
│   ├── modules/   → Auth, Projects, Material Requests, etc.
│   ├── middleware/→ Authentication, role checking, file upload
│   └── config/    → Database connection
```

---

## Tech Stack

**Backend:** Express.js + Prisma + PostgreSQL  
**Web:** React + Vite + Tailwind CSS  
**Mobile:** Expo + React Native  
**Security:** JWT tokens + bcrypt passwords + role-based access  
**Audit:** Immutable append-only log for all changes  

---

## Deployment

The system is built for easy cloud migration:

1. Create a PostgreSQL database on Railway, Supabase, or Neon
2. Update `DATABASE_URL` in `backend/.env`
3. Deploy backend to Railway or Render
4. Deploy web to Vercel
5. Update API URLs in mobile app

That's it. No code changes needed.

---

## Development

### Environment File
Create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/brickxbrick"
JWT_SECRET="your-secret-key-here"
PORT=3000
NODE_ENV="development"
```

### Database Commands
```bash
# View database UI
npx prisma studio

# Create a migration after schema changes
npx prisma migrate dev --name your_change_name

# Reset database (local only)
npx prisma migrate reset
```

### API Testing
Use Thunder Client (VS Code extension) or Postman:
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "ADMIN"
}
```

Valid roles: `ADMIN`, `PURCHASER`, `SITE_MANAGER`, `ACCOUNTANT`

---

## Troubleshooting

**Backend won't start**
```bash
# Check if port 3000 is in use
# Or change PORT=3001 in .env
```

**Database connection error**
```bash
# Verify PostgreSQL is running
psql -U postgres

# Check DATABASE_URL in .env has correct password
```

**Mobile can't reach backend**
```bash
# Get your computer's IP
ipconfig  # Windows
ifconfig  # Mac

# Update in mobile/services/api.js
baseURL: 'http://YOUR_IP:3000'

# Phone and laptop must be on same Wi-Fi
```

---

## License

Academic capstone project. All rights reserved by FourLoop().

---

*Built with PostgreSQL · Prisma · Express · React · Expo*
