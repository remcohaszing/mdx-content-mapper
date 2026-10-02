/**
 * @import { SpanMapping } from '../protocol.js'
 */

/**
 * Pad the generated offsets of a Volar code mapping.
 *
 * @param {SpanMapping[]} mappings
 *   The mapping whose generated offsets to pad.
 * @param {number} generatedPadding
 *   The padding to append to the generated offsets.
 * @returns {undefined}
 */
export function padMappings(mappings, generatedPadding) {
  for (const mapping of mappings) {
    mapping[0] += generatedPadding
  }
}
