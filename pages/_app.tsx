// pages/_app.tsx
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    // ✅ Supprimez complètement React.StrictMode
    <SessionProvider session={pageProps.session}>
      <Head>
        <title>Kahonyn - Mini-séries Ivoiriennes</title>
        <meta name="description" content="Regardez et partagez les meilleures mini-séries ivoiriennes" />
        <meta name="theme-color" content="#0D0D0D" />
        <link rel="icon" href="/logo-kahonyn.png" />
      </Head>
      <Component {...pageProps} />
      <Toaster 
        position="top-center"
        gutter={10}
        containerStyle={{ top: 80 }}
        toastOptions={{
          style: {
            background: '#1A1A2E',
            color: '#FFF',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontWeight: '600',
            fontSize: '14px',
            padding: '14px 20px',
            maxWidth: '400px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          },
          success: { 
            iconTheme: { primary: '#22C55E', secondary: '#1A1A2E' },
            duration: 2000,
            style: { border: '1px solid rgba(34,197,94,0.3)' }
          },
          error: { 
            iconTheme: { primary: '#EF4444', secondary: '#1A1A2E' },
            duration: 2500,
            style: { border: '1px solid rgba(239,68,68,0.3)' }
          },
        }}
      />
    </SessionProvider>
  )
}