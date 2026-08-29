import { Button } from './components/button.tsx'

const components = {
  Button
} as const

export function useMDXComponents(): typeof components {
  return components
}
