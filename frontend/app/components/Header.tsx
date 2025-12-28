'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { token, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-gray-800 shadow-lg"> {/* Standard dark background */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link href="/" passHref>
          <div className="text-2xl font-extrabold text-white hover:text-blue-400 transition duration-300 cursor-pointer"> {/* Standard white text */}
            Tune & Dine
          </div>
        </Link>

        <nav className="hidden md:flex space-x-6 items-center">
          <NavLink href="/music" text="Live Music" />
          <NavLink href="/meals" text="Meal Options" />
          <NavLink href="/about" text="About" />
        </nav>

        <div className="hidden md:block">
          {token ? (
            <div className="space-x-4">
              <Link href="/favorites" passHref>
                <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300">
                  My Favorites
                </button>
              </Link>
              <button
                onClick={logout}
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link href="/login" passHref>
                <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition duration-300"> {/* Changed to bg-blue-500 */}
                  Login
                </button>
              </Link>
              <Link href="/register" passHref>
                <button className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition duration-300"> {/* Changed to bg-green-500 */}
                  Register
                </button>
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden text-white text-2xl" /* Standard white text */
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-gray-800 z-50 transform ${ /* Standard dark background and z-50 */
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="flex justify-end p-4">
          <button
            className="text-white text-3xl"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            &times;
          </button>
        </div>
        <nav className="flex flex-col items-center space-y-8 mt-10">
          <NavLink href="/music" text="Live Music" onClick={() => setIsMobileMenuOpen(false)} />
          <NavLink href="/meals" text="Meal Options" onClick={() => setIsMobileMenuOpen(false)} />
          <NavLink href="/about" text="About" onClick={() => setIsMobileMenuOpen(false)} />
          {token && <NavLink href="/favorites" text="Favorites" onClick={() => setIsMobileMenuOpen(false)} />}

          {token ? (
            <>
              <Link href="/favorites" passHref onClick={() => setIsMobileMenuOpen(false)}>
                <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 w-48 text-center">
                  My Favorites
                </button>
              </Link>
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition duration-300 w-48 text-center"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" passHref onClick={() => setIsMobileMenuOpen(false)}>
                <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition duration-300 w-48 text-center">
                  Login
                </button>
              </Link>
              <Link href="/register" passHref onClick={() => setIsMobileMenuOpen(false)}>
                <button className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition duration-300 w-48 text-center">
                  Register
                </button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  text: string;
  onClick?: () => void; // Add optional onClick handler
}

const NavLink: React.FC<NavLinkProps> = ({ href, text, onClick }) => (
  <Link href={href} passHref onClick={onClick}>
    <span className="text-white hover:text-blue-400 font-medium transition duration-300">
      {text}
    </span>
  </Link>
);