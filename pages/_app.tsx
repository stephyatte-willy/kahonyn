// pages/_app.tsx
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <title>Kahonyn - Mini-séries ivoiriennes</title>
        <meta name="description" content="Regardez et partagez les meilleures mini-séries ivoiriennes" />
      </Head>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 80, // Décalage pour ne pas cacher la navbar
        }}
        toastOptions={{
          // Styles par défaut
          style: {
            background: '#1A1A35',
            color: '#FFF',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '12px 20px',
            maxWidth: '380px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          },
          
          // Toast succès
          success: { 
            iconTheme: { 
              primary: '#22C55E',
              secondary: '#1A1A35' 
            },
            duration: 2000,
            style: {
              border: '1px solid rgba(34,197,94,0.3)',
            }
          },
          
          // Toast erreur
          error: { 
            iconTheme: { 
              primary: '#EF4444',
              secondary: '#1A1A35' 
            },
            duration: 2500,
            style: {
              border: '1px solid rgba(239,68,68,0.3)',
            }
          },
          
          // Toast chargement
          loading: {
            duration: Infinity,
            style: {
              border: '1px solid rgba(255,107,53,0.3)',
            }
          },
        }}
      />
    </SessionProvider>
  )
}