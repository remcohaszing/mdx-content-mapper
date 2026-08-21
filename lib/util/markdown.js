import rawMarkdownExtensions from 'markdown-extensions'

import { isExtension } from './misc.js'

const defaultMarkdownExtensions = rawMarkdownExtensions.map((extension) => `.${extension}`)

/**
 * @param {unknown} extensions
 * @returns {string[]}
 */
export function getMarkdownExtensions(extensions) {
  if (!Array.isArray(extensions)) {
    return defaultMarkdownExtensions
  }

  if (extensions.length === 0) {
    return extensions
  }

  const strings = extensions.filter((extension) => typeof extension === 'string')
  const validExtensions = strings.filter(isExtension)

  if (validExtensions.length === 0) {
    return defaultMarkdownExtensions
  }

  return validExtensions
}
