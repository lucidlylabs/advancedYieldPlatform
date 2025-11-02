import { ReactNode } from "react"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Advanced Yield Platform',
    description: 'Advanced Yield Platform for DeFi',
    metadataBase: new URL('https://app.lucidly.finance'),
    icons: {
      icon: [
        { url: '/images/logo/Logomark_200_200.png', sizes: '200x200', type: 'image/png' },
        { url: '/images/logo/Dark_Logomark_1024_1024.png', sizes: '1024x1024', type: 'image/png' },
      ],
      shortcut: '/images/logo/Logomark_200_200.png',
      apple: '/images/logo/Logomark_200_200.png',
    },
    manifest: '/manifest.json',
    openGraph: {
      title: 'Lucidly Finance - Advanced Yield Platform',
      description: 'Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance.',
      url: 'https://app.lucidly.finance',
      siteName: 'Lucidly Finance',
      images: [
        {
          url: '/images/icons/thumbnail.png',
          width: 1200,
          height: 630,
          alt: 'Lucidly Finance - Advanced Yield Platform for DeFi',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Lucidly Finance - Advanced Yield Platform',
      description: 'Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance.',
      images: ['/images/icons/thumbnail.png'],
      creator: '@LucidlyFinance',
    },
    other: {
      'fc:miniapp': JSON.stringify({
        version: 'next',
        imageUrl: 'https://app.lucidly.finance/assets/farcaster/og-image.png',
        button: {
          title: 'Launch Lucidly',
          action: {
            type: 'launch_miniapp',
            name: 'Lucidly',
            url: 'https://app.lucidly.finance/farcaster',
            splashImageUrl: 'https://app.lucidly.finance/images/logo/Dark_Logomark_200_200.png',
            splashBackgroundColor: '#080B17',
          },
        },
      }),
    },
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7B5FFF" />
        
        {/* Open Graph Meta Tags for Social Media Thumbnails */}
        <meta property="og:title" content="Lucidly Finance - Advanced Yield Platform" />
        <meta property="og:description" content="Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance." />
        <meta property="og:url" content="https://app.lucidly.finance" />
        <meta property="og:site_name" content="Lucidly Finance" />
        <meta property="og:image" content="https://app.lucidly.finance/images/icons/thumbnail.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Lucidly Finance - Advanced Yield Platform for DeFi" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lucidly Finance - Advanced Yield Platform" />
        <meta name="twitter:description" content="Discover the most advanced DeFi yield platform. Earn optimal returns on your crypto assets with Lucidly Finance." />
        <meta name="twitter:image" content="https://app.lucidly.finance/images/icons/thumbnail.png" />
        <meta name="twitter:image:alt" content="Lucidly Finance - Advanced Yield Platform for DeFi" />
        <meta name="twitter:creator" content="@LucidlyFinance" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
} 