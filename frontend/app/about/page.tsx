// frontend/app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white">About Us</h1>
      <p className="mt-4 text-gray-300 leading-relaxed">
        Welcome to Tune & Dine, your ultimate guide to discovering vibrant local experiences. We connect you with a diverse range of establishments – from cozy diners and lively restaurants to buzzing bars and unique venues that perfectly blend delicious meals with captivating live performances. Our mission is to make it effortless for you to find exactly what you're looking for, whether it's a quiet dinner with background music or a night out enjoying your favorite band with great food. Dive in, explore with advanced search filters, save your favorite spots, and let Tune & Dine help you discover your next unforgettable outing.
      </p>
    </main>
  );
}