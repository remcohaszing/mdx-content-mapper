import type { Viewport } from 'next'
import type { ReactNode } from 'react'

export const viewport: Viewport = {
  colorScheme: 'light dark'
}

export default function RootLayout({ children }: LayoutProps<'/'>): ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
