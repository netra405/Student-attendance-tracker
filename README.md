## Attendance Tracker

A role‑locked **admin-only attendance tracking dashboard** built with **Next.js App Router**.  
It uses **NextAuth** for authentication, **MongoDB (Mongoose)** for data storage, **Redux Toolkit** for basic UI state, and **Tailwind CSS** for styling and layout.

### Main Features

- **Single admin** model (only one admin account can exist).
- **Email/password + Google OAuth** authentication (NextAuth v5).
- **Email verification** for admin signup (via Nodemailer).
- **Student management** and **attendance recording**.
- **Reports and dashboard stats** with charts.
- **Responsive UI** with sidebar navigation and cards.

### Tech Stack

- **Framework**: Next.js `16` (App Router, `app/` directory).
- **Language**: TypeScript.
- **UI / Styling**: Tailwind CSS `^4`, `tailwind-merge`, `clsx`, `framer-motion` for animations, `lucide-react` for icons.
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`).
- **Charts**: Recharts.
- **Backend / DB**: MongoDB with Mongoose.
- **Auth**: NextAuth `^5.0.0-beta` (credentials + Google).
- **Security / Passwords**: bcryptjs.
- **Email**: Nodemailer (for verification emails).

### Required Packages (from `package.json`)

Runtime dependencies:

- `next`
- `react`
- `react-dom`
- `next-auth`
- `mongoose`
- `bcryptjs`
- `nodemailer`
- `axios`
- `@reduxjs/toolkit`
- `react-redux`
- `recharts`
- `framer-motion`
- `lucide-react`
- `clsx`
- `tailwind-merge`

Dev dependencies:

- `typescript`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `tailwindcss`
- `@tailwindcss/postcss`
- `babel-plugin-react-compiler`

### Environment Variables

Create a `.env.local` file in the project root and provide at least:

- `MONGODB_URI` – MongoDB connection string.
- `NEXTAUTH_SECRET` – secret for NextAuth JWT/session.
- `GOOGLE_ID` – Google OAuth client ID.
- `GOOGLE_SECRET` – Google OAuth client secret.
- `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD` – SMTP settings for Nodemailer.
- `EMAIL_FROM` – from address for verification emails.

### Scripts

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Production start**: `npm run start`

### Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with the variables listed above.
3. Make sure MongoDB is running and `MONGODB_URI` is correct.
4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` and create the first admin either via **manual signup** or **Google** (as configured).

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
