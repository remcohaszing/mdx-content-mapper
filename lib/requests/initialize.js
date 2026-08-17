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
    positionEncoding: 'utf-16',
    diagnosticSource: 'MDX'
  }
}
