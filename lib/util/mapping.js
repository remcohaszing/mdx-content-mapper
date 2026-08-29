/**
 * @import { SpanMapFeature, SpanMapKind, SpanMapping } from '../protocol.js'
 */

/**
 * Generate mapped virtual content based on a source string and start and end offsets.
 *
 * @param {SpanMapping[]} mappings
 *   The Volar mapping to append the offsets to.
 * @param {string} source
 *   The original source code.
 * @param {string} generated
 *   The generated content so far.
 * @param {number} startOffset
 *   The start offset in the original source code.
 * @param {number} endOffset
 *   The end offset in the original source code.
 * @param {boolean} [includeNewline]
 *   If true, and the source range is followed directly by a newline, extend the
 *   end offset to include that newline.
 * @param {SpanMapKind} [kind]
 * @param {SpanMapFeature} [feature]
 * @returns {string}
 *   The updated generated content.
 */
export function addOffset(
  mappings,
  source,
  generated,
  startOffset,
  endOffset,
  includeNewline,
  kind = 0,
  feature = 1_048_575
) {
  if (startOffset === endOffset) {
    return generated
  }

  if (includeNewline) {
    const LF = 10
    const CR = 13
    const charCode = source.charCodeAt(endOffset)
    if (charCode === LF) {
      endOffset += 1
    } else if (charCode === CR && source.charCodeAt(endOffset + 1) === LF) {
      endOffset += 2
    }
  }

  const length = endOffset - startOffset
  const previousMapping = mappings.at(-1)
  if (
    previousMapping !== undefined &&
    previousMapping[5] === feature &&
    previousMapping[2] + previousMapping[3] === startOffset &&
    previousMapping[0] + previousMapping[1] === generated.length
  ) {
    previousMapping[1] += length
    previousMapping[3] += length
  } else {
    mappings.push([generated.length, length, startOffset, length, kind, feature])
  }

  return generated + source.slice(startOffset, endOffset)
}

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
