import type { Disposable, ExtensionContext } from 'vscode'

import { extensions } from 'vscode'

import pkg from '../../package.json' with { type: 'json' }

export async function activate(context: ExtensionContext): Promise<undefined> {
  let disposable: Disposable

  const unregister = (): undefined => {
    disposable?.dispose()
  }

  const register = async (): Promise<undefined> => {
    const extension = extensions.getExtension('TypescriptTeam.vscode-typescript')

    if (!extension) {
      unregister()
      return
    }

    if (disposable) {
      return
    }

    const api = await extension.activate()

    if (!api) {
      return
    }

    const { name, typescript, version } = pkg
    const { compilerOptions, dynamicConfig } = typescript.contentMapper

    const { packageJSON } = context.extension

    disposable = api.registerContentMappers(`${packageJSON.publisher}.${packageJSON.name}`, [
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

  context.subscriptions.push({ dispose: unregister })
  extensions.onDidChange(register)
  await register()
}
