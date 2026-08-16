import { defineConfig } from 'rolldown'

export default defineConfig({
  external: 'vscode',
  platform: 'node',
  output: {
    cleanDir: true,
    minify: true
  },
  input: {
    server: '../lib/server.js',
    extension: './src/extension.ts'
  }
})
