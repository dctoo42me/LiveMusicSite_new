import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary
import { ToastProvider } from './contexts/ToastContext'; // Import ToastProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tune & Dine | Live Music & Meal Finder",
  description: "Discover local venues offering delicious meals paired with live music events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dark-background text-white`}
      >
        <ErrorBoundary> {/* Wrap the entire app with ErrorBoundary */}
          <AuthProvider>
            <ToastProvider> {/* Wrap with ToastProvider */}
              <Header />
              <main>{children}</main>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
