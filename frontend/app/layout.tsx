'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./global.css";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { useRef } from 'react';
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dark-background text-white`}>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <RootLayoutContent>
                {children}
              </RootLayoutContent>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth();
  const mobileMenuRef = useRef<HTMLInputElement>(null);

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.checked = false;
    }
  };

  return (
    <div className="drawer">
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" ref={mobileMenuRef} />
      <div className="drawer-content flex flex-col">
        <Header />
        <main className="flex-grow">{children}</main>
      </div> 
      <div className="drawer-side">
        <label htmlFor="my-drawer-3" aria-label="close sidebar" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-80 min-h-full bg-dark-background text-white">
          <li><Link href="/music" passHref onClick={closeMobileMenu}><span className="hover:text-primary transition-colors duration-300">Live Music</span></Link></li>
          <li><Link href="/meals" passHref onClick={closeMobileMenu}><span className="hover:text-primary transition-colors duration-300">Meal Options</span></Link></li>
          <li><Link href="/about" passHref onClick={closeMobileMenu}><span className="hover:text-primary transition-colors duration-300">About</span></Link></li>
          <div className="divider"></div>
          {token ? (
            <>
              <li><Link href="/favorites" passHref onClick={closeMobileMenu}><button className="btn btn-primary btn-block">My Favorites</button></Link></li>
              <li><button onClick={() => { logout(); closeMobileMenu(); }} className="btn btn-secondary btn-block mt-2">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link href="/login" passHref onClick={closeMobileMenu}><button className="btn btn-primary btn-block">Login</button></Link></li>
              <li><Link href="/register" passHref onClick={closeMobileMenu}><button className="btn btn-secondary btn-block mt-2">Register</button></Link></li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
