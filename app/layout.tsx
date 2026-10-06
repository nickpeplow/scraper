import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './app.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Scraper API',
  description: 'Web scraping API with proxy support',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
