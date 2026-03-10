import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { StoreProvider } from "@/store/StoreProvider";
import Footer from "@/components/Footer";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AttendanceTracker - Student Attendance Management",
  description:
    "A modern student attendance tracking application built with Next.js and MongoDB",
  manifest: "/manifest.webmanifest",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AttendanceTracker",
  },
};

function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // swallow errors – app should still work
      }
    };

    // Give Next.js a moment so dev/HMR is less likely to conflict
    const timeout = setTimeout(registerSW, 1500);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-gray-100`}
      >
        <StoreProvider>
          <SessionProvider>
            <ServiceWorkerRegister />
            {children}
            <Footer />
          </SessionProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
