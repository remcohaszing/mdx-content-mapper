/**
 * @import { Token } from 'micromark-util-types'
 * @import { SpanMapFeature, SpanMapKind, SpanMapping } from '../protocol.js'
 */

import { componentsNamespace, jsxIndent } from './constants.js'
import { padOffsets } from './mapping.js'

/**
 * @typedef Chunk
 * @property {string} text
 * @property {SpanMapping[]} mappings
 */

/**
 * @returns {Chunk}
 */
export function createChunk() {
  return { text: '', mappings: [] }
}

/**
 * @param {Chunk} chunk
 * @param {string} content
 * @param {number} generatedStart
 * @param {number} length
 */
export function appendVerbatimRange(chunk, content, generatedStart, length) {
  const chunkLength = chunk.text.length
  const previousMapping = chunk.mappings.at(-1)
  if (
    previousMapping !== undefined &&
    previousMapping[2] + previousMapping[3] === generatedStart &&
    previousMapping[0] + previousMapping[1] === chunkLength
  ) {
    previousMapping[1] += length
    previousMapping[3] += length
  } else {
    chunk.mappings.push([
      chunkLength,
      length,
      generatedStart,
      length,
      /** @satisfies {SpanMapKind.Verbatim} */ (0),
      /** @satisfies {SpanMapFeature.All} */ (1_048_575)
    ])
  }
  chunk.text += content.slice(generatedStart, generatedStart + length)
}

/**
 * @param {Chunk} chunk
 * @param {string} text
 * @param {number} originalStart
 * @param {number} originalLength
 * @param {SpanMapFeature} [features]
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
 * @param {Chunk} chunk
 * @param {string} content
 * @param {Token} token
 */
export function appendVerbatim(chunk, content, token) {
  const start = token.start.offset
  const end = token.end.offset
  appendVerbatimRange(chunk, content, start, end - start)
}

/**
 * @param {Chunk} chunk
 * @param {Token} token
 * @param {string} tagName
 * @param {string} openMarker
 * @param {string} closeMarker
 */
function appendJsx(chunk, token, tagName, openMarker, closeMarker) {
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
 * @param {Chunk} chunk
 * @param {string} tagName
 * @param {number} start
 * @param {number} length
 * @param {boolean} [closing]
 */
export function appendJsxRange(chunk, tagName, start, length, closing) {
  chunk.text += jsxIndent
  chunk.text += closing ? '</' : '<'
  appendAliasRange(
    chunk,
    componentsNamespace,
    start,
    length,
    /** @satisfies {SpanMapFeature.None} */ (0)
  )
  chunk.text += '.'
  appendAliasRange(chunk, tagName, start, length)
  chunk.text += '>'
}

/**
 * @param {Chunk} chunk
 * @param {string} tagName
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
 * @param {Chunk} chunk
 * @param {Token} token
 * @param {string} tagName
 */
export function appendJsxOpen(chunk, token, tagName) {
  appendJsx(chunk, token, tagName, '<', '>')
}

/**
 * @param {Chunk} chunk
 * @param {Token} token
 * @param {string} tagName
 */
export function appendJsxClose(chunk, token, tagName) {
  appendJsx(chunk, token, tagName, '</', '>')
}

/**
 * @param {Chunk} chunk
 * @param {Token} token
 * @param {string} tagName
 */
export function appendJsxSelfClosing(chunk, token, tagName) {
  appendJsx(chunk, token, tagName, '<', '/>')
}

/**
 * @param {Chunk} chunk
 * @param {number[]} injectionPoints
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

      padOffsets(mappings.slice(index), injectionString.length)

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
 * @param {Chunk} a
 * @param {Chunk} b
 */
export function mergeChunks(a, b) {
  for (const mapping of b.mappings) {
    mapping[0] += a.text.length
  }

  a.text += b.text
  a.mappings.push(...b.mappings)
}
