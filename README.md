# Attendance Tracker

Admin-focused attendance management app built with Next.js App Router.

## Features

- Admin authentication with email/password and Google login (NextAuth v5).
- One-admin signup flow with OTP email verification.
- Forgot password and reset password flow with email code.
- Student management (create, update, delete, search, class filter).
- Bulk attendance marking by class and date.
- Bikram Sambat (BS) date support and AD/BS calendar conversion.
- Dashboard analytics with charts (daily distribution and weekly trend).
- Detailed reports by month/class with per-student attendance insights.
- Admin settings to update email (with verification) and password.
- Admin BS calendar data manager to regenerate supported BS year ranges.

## Tech Stack

- Next.js 16 + TypeScript
- NextAuth (credentials + Google)
- MongoDB + Mongoose
- Redux Toolkit + React Redux
- Tailwind CSS 4 + Framer Motion
- Recharts
- Nodemailer

## Environment Variables

Create `.env.local` in project root:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `GOOGLE_ID`
- `GOOGLE_SECRET`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run generate:bs-data` - regenerate BS calendar dataset

## Run Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
