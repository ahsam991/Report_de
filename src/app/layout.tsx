import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "V2 Technologies ( Report De )",
  description: "Upload Excel → Generate SQL Reports Instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-background text-foreground overflow-hidden font-sans">
        <Sidebar />
        <main className="flex-1 h-screen overflow-y-auto relative flex flex-col">
          {/* Subtle gradient background light blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex-1 p-6 md:p-8 relative z-10 max-w-7xl w-full mx-auto">
            {children}
          </div>
          
          <footer className="py-6 border-t border-white/5 text-center text-xs text-muted-foreground select-none relative z-10">
            © 2026 V2 Technologies. All Rights Reserved.
          </footer>
        </main>
      </body>
    </html>
  );
}
