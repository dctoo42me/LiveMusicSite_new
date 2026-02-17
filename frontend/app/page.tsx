import { Suspense } from 'react';
import ClientHomePage from './client-home-page';

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientHomePage />
    </Suspense>
  );
}