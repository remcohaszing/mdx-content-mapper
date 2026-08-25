import { dirname, parse, relative } from 'node:path/posix'

/**
 * @typedef ReactRouterPropsTypeResult
 * @property {string} import
 * @property {string} type
 */

/**
 * @param {string} configFileName
 * @param {string} fileName
 * @returns {ReactRouterPropsTypeResult | undefined}
 */
export function getReactRouterPropsType(configFileName, fileName) {
  const relativePath = relative(dirname(configFileName), fileName)
  const routesDir = 'app/routes/'

  if (!relativePath.startsWith(routesDir)) {
    return
  }

  const path = relativePath.slice(routesDir.length)
  const { dir, name } = parse(path)

  if (dir.includes('/')) {
    return
  }

  return {
    import: `\n/** @import { Route } from './+types/${name}.js' */\n`,
    type: 'Route.ComponentProps'
  }
}
