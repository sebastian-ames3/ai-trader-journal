import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import Navigation from "@/components/Navigation";
import FloatingActionButton from "@/components/FloatingActionButton";
import OfflineIndicator from "@/components/OfflineIndicator";
import InstallPrompt from "@/components/InstallPrompt";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Trader Journal",
  description: "Track your options trades with AI-powered insights",
  manifest: "/manifest.json",
  themeColor: "#171717",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trader Journal",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OfflineIndicator />
          <Navigation />
          {children}
          <Toaster />
          <FloatingActionButton />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
