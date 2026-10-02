/**
 * @import { Token } from 'micromark-util-types'
 * @import { SpanMapFeature, SpanMapKind, SpanMapping } from '../protocol.js'
 */

import { componentsNamespace, jsxIndent } from './constants.js'
import { padMappings } from './mapping.js'

/**
 * @typedef Chunk
 *   A chunk of virtual text and span mappings.
 * @property {string} text
 *   The text content of the chunk.
 * @property {SpanMapping[]} mappings
 *   The span mappings that map the chunk text back to the original text.
 */

/**
 * Create an empty chunk.
 *
 * @returns {Chunk}
 *   The chunk.
 */
export function createChunk() {
  return { text: '', mappings: [] }
}

/**
 * Add a verbatim mapped text range to a chunk.
 *
 * If the span mapping is adjacent to the previous verbatim mapping, they will be merged.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {string} content
 *   The original content to take text from.
 * @param {number} originalStart
 *   The start position in the original content.
 * @param {number} length
 *   The length of the content to append.
 */
export function appendVerbatimRange(chunk, content, originalStart, length) {
  const chunkLength = chunk.text.length
  const previousMapping = chunk.mappings.at(-1)
  if (
    previousMapping !== undefined &&
    previousMapping[2] + previousMapping[3] === originalStart &&
    previousMapping[0] + previousMapping[1] === chunkLength
  ) {
    previousMapping[1] += length
    previousMapping[3] += length
  } else {
    chunk.mappings.push([
      chunkLength,
      length,
      originalStart,
      length,
      /** @satisfies {SpanMapKind.Verbatim} */ (0),
      /** @satisfies {SpanMapFeature.All} */ (1_048_575)
    ])
  }
  chunk.text += content.slice(originalStart, originalStart + length)
}

/**
 * Add an alias mapped text range to a chunk.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {string} text
 *   The text string to append to the chunk.
 * @param {number} originalStart
 *   The original start offset to map to.
 * @param {number} originalLength
 *   The original length to map to.
 * @param {SpanMapFeature} [features]
 *   The span map features to support.
 */
export function appendAliasRange(chunk, text, originalStart, originalLength, features = 1_048_575) {
  chunk.mappings.push([
    chunk.text.length,
    text.length,
    originalStart,
    originalLength,
    /** @satisfies {SpanMapKind.Alias} */ (2),
    features
  ])
  chunk.text += text
}

/**
 * Add a verbatim mapped micromark token to a chunk.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {string} content
 *   The original content to take text from.
 * @param {Token} token
 *   The micromark token to append.
 */
export function appendVerbatim(chunk, content, token) {
  const start = token.start.offset
  const end = token.end.offset
  appendVerbatimRange(chunk, content, start, end - start)
}

/**
 * Append an alias mapped JSX tag to the chunk.
 *
 * The JSX tag is taken from the `_components` object. Both the `_components` identifier and the tag
 * name are alias mapped to the token.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {Token} token
 *   The micromark token to map to.
 * @param {string} tagName
 *   The tag name of the JSX tag.
 * @param {string} openMarker
 *   The JSX tag open marker.
 * @param {string} closeMarker
 *   The JSX tag close marker.
 */
export function appendJsxTag(chunk, token, tagName, openMarker, closeMarker) {
  const start = token.start.offset
  const end = token.end.offset

  chunk.text += jsxIndent
  chunk.text += openMarker
  appendAliasRange(
    chunk,
    componentsNamespace,
    start,
    end - start,
    /** @satisfies {SpanMapFeature.None} */ (0)
  )
  chunk.text += '.'
  appendAliasRange(chunk, tagName, start, end - start)
  chunk.text += closeMarker
}

/**
 * Append an alias mapped JSX tag to the chunk.
 *
 * The JSX tag is taken from the `_components` object. Both the `_components` identifier and the tag
 * name are alias mapped to the original start and length.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {string} tagName
 *   The tag name of the JSX tag.
 * @param {number} originalStart
 *   The start offset of the mappings in the original content.
 * @param {number} originalLength
 *   The length of the mappings in the original content.
 * @param {boolean} [closing]
 *   Whether or not the tag is a closing tag.
 */
export function appendJsxRange(chunk, tagName, originalStart, originalLength, closing) {
  chunk.text += jsxIndent
  chunk.text += closing ? '</' : '<'
  appendAliasRange(
    chunk,
    componentsNamespace,
    originalStart,
    originalLength,
    /** @satisfies {SpanMapFeature.None} */ (0)
  )
  chunk.text += '.'
  appendAliasRange(chunk, tagName, originalStart, originalLength)
  chunk.text += '>'
}

/**
 * Append an unmapped JSX closing tag to the chunk.
 *
 * Type errors on this tag are suppressed using an `@ts-ignore` comment.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {string} tagName
 *   The tag name of the JSX tag.
 */
export function appendJsxCloseUnmapped(chunk, tagName) {
  chunk.text += jsxIndent
  chunk.text += '{/* @ts-ignore */}'
  chunk.text += jsxIndent
  chunk.text += '</'
  chunk.text += componentsNamespace
  chunk.text += '.'
  chunk.text += tagName
  chunk.text += '>'
}

/**
 * Append an alias mapped JSX open tag to the chunk.
 *
 * The JSX tag is taken from the `_components` object. Both the `_components` identifier and the tag
 * name are alias mapped to the token.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {Token} token
 *   The micromark token to map to.
 * @param {string} tagName
 *   The tag name of the JSX tag.
 */
export function appendJsxOpen(chunk, token, tagName) {
  appendJsxTag(chunk, token, tagName, '<', '>')
}

/**
 * Append an alias mapped JSX closing tag to the chunk.
 *
 * The JSX tag is taken from the `_components` object. Both the `_components` identifier and the tag
 * name are alias mapped to the token.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {Token} token
 *   The micromark token to map to.
 * @param {string} tagName
 *   The tag name of the JSX tag.
 */
export function appendJsxClose(chunk, token, tagName) {
  appendJsxTag(chunk, token, tagName, '</', '>')
}

/**
 * Append an alias mapped JSX self-closing tag to the chunk.
 *
 * The JSX tag is taken from the `_components` object. Both the `_components` identifier and the tag
 * name are alias mapped to the token.
 *
 * @param {Chunk} chunk
 *   The chunk to add the text to.
 * @param {Token} token
 *   The micromark token to map to.
 * @param {string} tagName
 *   The tag name of the JSX tag.
 */
export function appendJsxSelfClosing(chunk, token, tagName) {
  appendJsxTag(chunk, token, tagName, '<', '/>')
}

/**
 * Inject the `_components` namespace into the chunk at the given injection points.
 *
 * @param {Chunk} chunk
 *   The chunk to inject the injection points into.
 * @param {number[]} injectionPoints
 *   The offsets to inject the `_components` namespace.
 */
export function injectComponentsNamespace(chunk, injectionPoints) {
  let result = chunk.text
  const { mappings } = chunk
  const injectionString = `${componentsNamespace}.`
  let lastIndex = mappings.length - 1
  for (const injectionPoint of injectionPoints.toSorted((a, b) => b - a)) {
    for (let index = lastIndex; index >= 0; index -= 1) {
      const mapping = mappings[index]
      const [virtualStart, mappingLength, originalStart] = mapping
      if (injectionPoint < originalStart) {
        lastIndex = index + 1
        continue
      }

      const originalEnd = originalStart + mappingLength
      if (injectionPoint > originalEnd) {
        continue
      }

      const beforeLength = injectionPoint - originalStart
      const afterLength = mappingLength - beforeLength
      const virtualSplit = virtualStart + beforeLength

      padMappings(mappings.slice(index), injectionString.length)

      mappings.splice(
        index,
        1,
        [virtualStart, beforeLength, originalStart, beforeLength, 0, 1_048_575],
        [
          virtualSplit + injectionString.length,
          afterLength,
          originalStart + beforeLength,
          afterLength,
          0,
          1_048_575
        ]
      )
      const beforeResult = result.slice(0, virtualSplit)
      const afterResult = result.slice(virtualSplit)
      result = beforeResult + injectionString + afterResult
    }
  }
  chunk.text = result
}

/**
 * Merge the source chunk into target chunk.
 *
 * After this operation, source chunk will be unusable.
 *
 * @param {Chunk} target
 *   The remaining chunk.
 * @param {Chunk} source
 *   The chunk to merge and discard.
 */
export function mergeChunks(target, source) {
  for (const mapping of source.mappings) {
    mapping[0] += target.text.length
  }

  target.text += source.text
  target.mappings.push(...source.mappings)
}
