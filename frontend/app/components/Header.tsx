'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { token, logout } = useAuth();

  return (
    <div className="w-full navbar bg-dark-background text-white shadow-lg">
      <div className="flex-none lg:hidden">
        <label htmlFor="my-drawer-3" aria-label="open sidebar" className="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
      </div>
      <div className="flex-1 px-2 mx-2 text-2xl font-extrabold">
        <Link href="/" passHref>
          <span className="cursor-pointer hover:text-primary transition-colors duration-300">Tune & Dine</span>
        </Link>
      </div>
      <div className="flex-none hidden lg:block">
        <ul className="menu menu-horizontal items-center space-x-2">
          <li><Link href="/music" passHref><span className="hover:text-primary transition-colors duration-300">Live Music</span></Link></li>
          <li><Link href="/meals" passHref><span className="hover:text-primary transition-colors duration-300">Meal Options</span></Link></li>
          <li><Link href="/about" passHref><span className="hover:text-primary transition-colors duration-300">About</span></Link></li>
          
          {token ? (
            <>
              <li><Link href="/favorites" passHref><button className="btn btn-primary btn-sm">My Favorites</button></Link></li>
              <li><button onClick={logout} className="btn btn-secondary btn-sm">Logout</button></li>
            </>
          ) : (
            <>
              <li><Link href="/login" passHref><button className="btn btn-primary btn-sm">Login</button></Link></li>
              <li><Link href="/register" passHref><button className="btn btn-secondary btn-sm">Register</button></Link></li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}