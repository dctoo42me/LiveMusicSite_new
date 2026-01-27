import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary
import { ToastProvider } from './contexts/ToastContext'; // Import ToastProvider
import { useRef } from 'react'; // Import useRef

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
    <html lang="en" data-theme="dark"> {/* Add data-theme="dark" for daisyUI dark theme */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dark-background text-white`}
      >
        <ErrorBoundary> {/* Wrap the entire app with ErrorBoundary */}
          <AuthProvider>
            <ToastProvider> {/* Wrap with ToastProvider */}
              <RootLayoutContent> {/* New component to handle drawer logic and context */}
                {children}
              </RootLayoutContent>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

// Separate component to use hooks like useRef and useAuth
function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth(); // Use useAuth here
  const mobileMenuRef = useRef<HTMLInputElement>(null); // Ref for controlling the drawer checkbox

  // Close mobile menu when navigation occurs
  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.checked = false;
    }
  };

  return (
    <div className="drawer">
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" ref={mobileMenuRef} />
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <Header />
        {/* Page content here */}
        <main className="flex-grow">{children}</main> {/* flex-grow to push footer to bottom */}
      </div> 
      <div className="drawer-side">
        <label htmlFor="my-drawer-3" aria-label="close sidebar" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-80 min-h-full bg-dark-background text-white">
          {/* Sidebar content here */}
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
