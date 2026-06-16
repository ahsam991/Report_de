import type { Metadata } from "next";
import Sidebar from "@/components/sidebar";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
        className="min-h-full flex bg-background text-foreground overflow-hidden"
      >
        <Sidebar />
        <main className="flex-1 h-screen overflow-y-auto relative flex flex-col">
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
