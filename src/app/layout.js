import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./globals-print.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { Toaster } from "sonner";
import ErrorBoundaryProvider from "@/components/error-boundary-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sistema de Gestión de Envíos",
  description: "Sistema integral de gestión de envíos y logística",
};

export default async function RootLayout({ children }) {
  const session = await auth();
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundaryProvider>
          <SessionProvider session={session}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </SessionProvider>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
