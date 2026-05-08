import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Alertas Interbancario",
  description: "Sistema de Alertas Interbancario - Costa Rica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-[#ffffff] text-[#181d26]`}
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
