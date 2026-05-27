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
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#FFF8F0',
            borderRadius: '16px',
          },
          success: {
            iconTheme: {
              primary: '#FF6B35',
              secondary: '#1A1A1A',
            },
          },
        }}
      />
    </SessionProvider>
  )
}