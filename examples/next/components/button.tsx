import type { ComponentProps, ReactNode } from 'react'

export function Button(props: ComponentProps<'button'>): ReactNode {
  return <button type="button" {...props} />
}
