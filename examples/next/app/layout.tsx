import type { Viewport } from 'next'
import type { ReactNode } from 'react'

export const viewport: Viewport = {
  colorScheme: 'light dark'
}

/**
 * Render the root layout of the app.
 */
export default function RootLayout({ children }: LayoutProps<'/'>): ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
