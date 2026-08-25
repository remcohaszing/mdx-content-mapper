import { Button } from './components/button.tsx'

const components = {
  Button
}

export function useMDXComponents(): typeof components {
  return components
}
