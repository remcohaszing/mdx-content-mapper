import type { ComponentProps, ReactNode } from 'react'

/**
 * Render a button which defaults to type button.
 */
export function Button(props: ComponentProps<'button'>): ReactNode {
  return <button type="button" {...props} />
}
