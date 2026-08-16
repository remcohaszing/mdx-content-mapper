import type { ExtensionContext } from 'vscode'

import { extensions } from 'vscode'

import pkg from '../../package.json' with { type: 'json' }

export async function activate(context: ExtensionContext): Promise<undefined> {
  const extension = extensions.getExtension('TypeScriptTeam.native-preview')

  if (!extension) {
    return
  }

  const api = await extension.activate()

  const { name, typescript, version } = pkg
  const { compilerOptions, dynamicConfig } = typescript.contentMapper

  const { packageJSON } = context.extension

  api.registerContentMappers(`${packageJSON.publisher}.${packageJSON.name}`, [
    {
      extensions: ['.vue'],
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
