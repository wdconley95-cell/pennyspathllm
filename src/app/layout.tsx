import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap'
})

export const metadata: Metadata = {
  title: "Penny's Path - AI Career Coaching",
  description: "Your friendly AI career coach powered by advanced language models. Get personalized guidance from Penny the Pig and her expert coaching personas.",
  keywords: ['career coaching', 'AI assistant', 'professional development', 'job guidance'],
  authors: [{ name: "Penny's Path Team" }],
  creator: "Penny's Path",
  publisher: "Penny's Path",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Penny's Path - AI Career Coaching",
    description: "Your friendly AI career coach powered by advanced language models",
    url: '/',
    siteName: "Penny's Path",
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "Penny's Path - AI Career Coaching",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Penny's Path - AI Career Coaching",
    description: "Your friendly AI career coach powered by advanced language models",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here if needed
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E35C4A" />
        <meta name="color-scheme" content="light dark" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body 
        className={cn(
          'min-h-screen bg-sand font-sans antialiased',
          inter.variable,
          jakarta.variable
        )}
        suppressHydrationWarning
      >
        <div className="relative flex h-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
