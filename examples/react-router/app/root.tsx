import type { ReactNode } from 'react'

import { Outlet, Scripts } from 'react-router'

export default function App(): ReactNode {
  return (
    <html lang="en">
      <head>
        <meta content="light dark" name="color-scheme" />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
