import mdx from '@mdx-js/rollup'
import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: '#mdx-components'
    }),
    reactRouter()
  ]
})
