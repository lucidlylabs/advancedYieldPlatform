import { TooltipProvider } from "@/components/ui/tooltip"
import { ReactNode } from "react"

export const metadata = {
  title: 'Advanced Yield Platform',
  description: 'Advanced Yield Platform for DeFi',
  icons: {
    icon: '/images/logo/logo.svg',
    shortcut: '/images/logo/logo.svg',
    apple: '/images/logo/logo.svg',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo/logo.svg" />
        <link rel="apple-touch-icon" href="/images/logo/logo.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
} 