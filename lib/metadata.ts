// utils/metadata.ts
import { collection, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Metadata } from 'next';

interface GameMetadata {
  title: string;
  description: string;
  image: string;
}

export async function getGameMetadata(slug: string): Promise<GameMetadata | null> {
  try {
    const gamesRef = collection(db, 'games');
    const snapshot = await getDocs(gamesRef);
    const game = snapshot.docs.find(doc => doc.data().slug === slug);
    
    if (!game) return null;
    
    const gameData = game.data();
    return {
      title: gameData.title,
      description: gameData.description,
      image: gameData.image,
    };
  } catch (error) {
    console.error('Error fetching game metadata:', error);
    return null;
  }
}

export async function generateGameMetadata(slug: string): Promise<Metadata> {
  const gameData = await getGameMetadata(slug);
  
  if (!gameData) {
    return {
      title: 'Game Not Found | WagerX',
      description: 'The requested game could not be found.',
    };
  }

  return {
    title: `${gameData.title} | WagerX Games`,
    description: gameData.description,
    openGraph: {
      title: `${gameData.title} | WagerX Games`,
      description: gameData.description,
      images: [gameData.image],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${gameData.title} | WagerX Games`,
      description: gameData.description,
      images: [gameData.image],
    },
  };
}

export const defaultMetadata: Metadata = {
  title: 'WagerX - Play and Win',
  description: 'Experience the thrill of gaming with WagerX. Play your favorite games and win big!',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wagerx.com',
    siteName: 'WagerX',
    title: 'WagerX - Play and Win',
    description: 'Experience the thrill of gaming with WagerX. Play your favorite games and win big!',
    images: [
      {
        url: '/images/og-image.jpg',  // Make sure to add a default OG image
        width: 1200,
        height: 630,
        alt: 'WagerX Gaming Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WagerX - Play and Win',
    description: 'Experience the thrill of gaming with WagerX. Play your favorite games and win big!',
    images: ['/images/og-image.jpg'],
  },
};