import { dirname, parse, relative } from 'node:path/posix'

/**
 * @param {string} string
 * @param {string} prefix
 * @returns {string}
 */
function unprefix(string, prefix) {
  if (string.startsWith(prefix)) {
    return string.slice(prefix.length)
  }

  return string
}

/**
 * @param {string} configFileName
 * @param {string} fileName
 * @returns {string | undefined}
 */
export function getNextPropsType(configFileName, fileName) {
  const relativePath = relative(dirname(configFileName), fileName)
  const unprefixed = unprefix(relativePath, 'src/')
  if (!unprefixed.startsWith('app/')) {
    return
  }
  const { dir, name } = parse(unprefix(unprefixed, 'app'))
  if (name !== 'page') {
    return
  }

  return `PageProps<'${dir}'>`
}
