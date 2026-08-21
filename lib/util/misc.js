import assert from 'node:assert/strict'

/**
 * Assert that a function is not nullish.
 *
 * @template T
 *   The type of the expected value
 * @param {T | null | undefined | void} value
 *   The value that might be nullish.
 * @returns {T}
 *   The value if it’s not nullish.
 */
export function nonNull(value) {
  assert.ok(value != null, 'Expected value to be defined')
  return value
}

/**
 * @param {string} fileName
 * @param {string[]} extensions
 * @returns {boolean}
 */
export function hasExtension(fileName, extensions) {
  return extensions.some((extension) => fileName.endsWith(extension))
}

/**
 * @param {string} extension
 * @returns {boolean}
 */
export function isExtension(extension) {
  return /\.\w+$/.test(extension)
}

/**
 * Check whether a value is an object.
 *
 * @param {unknown} value
 *   The value to check.
 * @returns {value is Record<string, unknown>}
 *   Whether or not the value is an object.
 */
export function isObject(value) {
  return typeof value === 'object' && value != null
}
