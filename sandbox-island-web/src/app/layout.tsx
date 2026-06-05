import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sandbox Island Survival | Official Wiki',
  description: 'Official database and landing page for Sandbox Island Survival Roblox game.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}