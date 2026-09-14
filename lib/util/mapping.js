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
 * @param {number} [originalPadding]
 *   The padding to append to the original offsets.
 * @returns {undefined}
 */
export function padOffsets(mappings, generatedPadding, originalPadding = 0) {
  for (const mapping of mappings) {
    mapping[0] += generatedPadding
    mapping[2] += originalPadding
  }
}
