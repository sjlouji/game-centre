

import type { AppProps } from 'next/app';
import Head from 'next/head';
// FIX: Import useRouter and GameId to dynamically manage header state.
import { useRouter } from 'next/router';
import AppHeader from '../components/AppHeader';
import type { GameId } from '../lib/games';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // FIX: Determine active game from the route to pass to the header.
  const path = router.pathname;
  const activeGame = path === '/' ? 'menu' : (path.substring(1) as GameId);

  const handleBack = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Game Center</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="A fully functional game center built with Next.js, React, TypeScript, and Tailwind CSS." />
      </Head>
      <div className="w-full min-h-screen flex flex-col items-center justify-start p-4 sm:p-12">
        {/* FIX: Pass required props to AppHeader. */}
        <AppHeader activeGame={activeGame} onBack={handleBack} />
        <main className="w-full flex-grow flex flex-col">
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}

export default MyApp;
