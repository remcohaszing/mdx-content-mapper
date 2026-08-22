import type { ExtensionContext } from 'vscode'

import { extensions } from 'vscode'

import pkg from '../../package.json' with { type: 'json' }

export async function activate(context: ExtensionContext): Promise<undefined> {
  const register = async (): Promise<undefined> => {
    const extension = extensions.getExtension('TypescriptTeam.vscode-typescript')

    if (!extension) {
      return
    }

    const api = await extension.activate()

    if (!api) {
      return
    }

    const { name, typescript, version } = pkg
    const { compilerOptions, dynamicConfig } = typescript.contentMapper

    const { packageJSON } = context.extension

    api.registerContentMappers(`${packageJSON.publisher}.${packageJSON.name}`, [
      {
        extensions: ['.mdx'],
        inferredProjectContribution: {
          options: {},
          manifest: {
            name,
            version,
            exec: [process.execPath, context.asAbsolutePath('dist/server.js')],
            cwd: extension.extensionUri,
            compilerOptions,
            dynamicConfig
          }
        }
      }
    ])
  }

  extensions.onDidChange(register)
  await register()
}
