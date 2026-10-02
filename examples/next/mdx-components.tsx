import { Button } from './components/button.tsx'

const components = {
  Button
} as const

/**
 * Provide MDX components.
 *
 * @returns
 *   MDX components.
 */
export function useMDXComponents(): typeof components {
  return components
}
