/**
 * @import { InitializeResult } from '../protocol.js'
 */

/**
 * Initialize the TypeScript content mapper.
 *
 * @returns {InitializeResult}
 *   The result for the `initialize` request.
 */
export function initialize() {
  return {
    protocolVersion: 1,
    // eslint-disable-next-line unicorn/text-encoding-identifier-case
    positionEncoding: 'utf-8',
    diagnosticSource: 'mdx'
  }
}
