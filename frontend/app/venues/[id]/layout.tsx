// frontend/app/venues/[id]/layout.tsx
import { Metadata } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = (await params).id;

  try {
    const response = await fetch(`${API_BASE_URL}/venues/${id}`);
    if (!response.ok) throw new Error('Failed to fetch venue for metadata');
    const venue = await response.json();

    const title = `${venue.name} - Live Music & Dining in ${venue.city}`;
    const description = venue.description || `Discover live performances and great meals at ${venue.name} in ${venue.city}, ${venue.state}.`;
    const imageUrl = venue.imageUrl || 'https://forks-feedback.vercel.app/LMS_hero_image2.png'; // Fallback to absolute URL if possible

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [imageUrl],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Venue Details | Forks & Feedback',
      description: 'Discover the intersection of great food and live entertainment.',
    };
  }
}

export default function VenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
