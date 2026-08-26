import rawmdExtensions from 'markdown-extensions'

import { isExtension } from './misc.js'

const defaultmdExtensions = rawmdExtensions.map((extension) => `.${extension}`)

/**
 * @param {unknown} extensions
 * @returns {string[]}
 */
export function getmdExtensions(extensions) {
  if (!Array.isArray(extensions)) {
    return defaultmdExtensions
  }

  if (extensions.length === 0) {
    return extensions
  }

  const strings = extensions.filter((extension) => typeof extension === 'string')
  const validExtensions = strings.filter(isExtension)

  if (validExtensions.length === 0) {
    return defaultmdExtensions
  }

  return validExtensions
}
