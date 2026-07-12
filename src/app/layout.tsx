// src/app/layout.tsx
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SocketProvider } from "@/components/SocketProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TransitOps | Hackathon 2026",
  description: "Smart Transport Operations Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-slate-900 min-h-screen">
        <Providers>
          <SocketProvider>
            {children}
          </SocketProvider>
        </Providers>
      </body>
    </html>
  );
}