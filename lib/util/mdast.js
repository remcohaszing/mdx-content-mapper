/**
 * @import { Code, Nodes } from 'mdast'
 * @import { Node, Point } from 'unist'
 * @import { MdxFlowExpression, MdxTextExpression } from 'mdast-util-mdx-expression'
 * @import { MappedOutput, SpanMapping } from '../protocol.js'
 */

import { componentsNamespace } from './constants.js'
import { padOffsets } from './mapping.js'
import { nonNull } from './misc.js'

/**
 * Get the offset of a parsed unist point.
 *
 * @param {Point} point
 *   The unist point of which to get the offset.
 * @returns {number}
 *   The offset of the unist point.
 */
export function getPointOffset(point) {
  return nonNull(point.offset)
}

/**
 * Get the start offset of a parsed unist point.
 *
 * @param {Node} node
 *   The unist point of which to get the start offset.
 * @returns {number}
 *   The start offset of the unist point.
 */
export function getNodeStartOffset(node) {
  return getPointOffset(nonNull(node.position).start)
}

/**
 * Get the end offset of a parsed unist point.
 *
 * @param {Node} node
 *   The unist point of which to get the end offset.
 * @returns {number}
 *   The end offset of the unist point.
 */
export function getNodeEndOffset(node) {
  return getPointOffset(nonNull(node.position).end)
}

/**
 * Recursively visit an mdast tree.
 *
 * @param {Nodes} node
 *   The mdast node to visit.
 * @param {(node: Nodes) => undefined} enter
 *   A callback to call before its children are visisted.
 * @param {(node: Nodes) => undefined} exit
 *   A callback to call after its children are visisted.
 * @returns {undefined}
 */
export function visit(node, enter, exit) {
  enter(node)
  if ('children' in node) {
    for (const child of node.children) {
      visit(child, enter, exit)
    }
  }
  exit(node)
}

/** @type {Map<string, MappedOutput['extension']>} */
const codeExtensions = new Map([
  ['cjs', '.cjs'],
  ['cts', '.cts'],
  ['javascript', '.js'],
  ['javascriptreact', '.jsx'],
  ['js', '.js'],
  ['json', '.json'],
  ['jsonc', '.json'],
  ['jsx', '.jsx'],
  ['mjs', '.mjs'],
  ['mts', '.mts'],
  ['ts', '.ts'],
  ['tsx', '.tsx'],
  ['typescript', '.ts'],
  ['typescriptreact', '.tsx']
])

/**
 * @param {Code} node
 * @param {string} mdx
 * @returns {MappedOutput | undefined}
 */
export function processCodeBlock(node, mdx) {
  const { lang, value } = node

  if (!lang) {
    return
  }

  const extension = codeExtensions.get(lang)

  if (!extension) {
    return
  }

  /** @type {SpanMapping[]} */
  const mappings = []
  let newline = mdx.indexOf('\n', getNodeStartOffset(node) + 1)
  let virtualStart = 0
  const valueLines = value.split('\n')

  for (const [index, valueLine] of valueLines.entries()) {
    newline = mdx.indexOf('\n', newline + 1)
    let mappingLength = valueLine.length
    const originalStart = newline - mappingLength
    if (index !== valueLines.length - 1) {
      mappingLength += 1
    }
    const previousMapping = mappings.at(-1)
    if (previousMapping && previousMapping[2] + previousMapping[3] === originalStart) {
      previousMapping[1] += mappingLength
      previousMapping[3] += mappingLength
    } else {
      mappings.push([virtualStart, mappingLength, originalStart, mappingLength, 0, 1_048_575])
    }
    virtualStart += mappingLength
  }

  return { text: value, extension, mappings }
}

/**
 * @param {MdxFlowExpression | MdxTextExpression} node
 * @param {string} mdx
 * @param {number[]} injectionPoints
 * @returns {[string, SpanMapping[]]}
 */
export function processJsxExpression2(node, mdx, injectionPoints) {
  let result = '{'
  const { value } = node
  const start = getNodeStartOffset(node)
  const end = getNodeEndOffset(node) - 1

  /** @type {SpanMapping[]} */
  const mappings = [[0, 1, start, 1, 0, 1_048_575]]
  let lineStart = start

  for (const match of value.matchAll(/.*\n?/g)) {
    const [valueLine] = match
    if (!valueLine) {
      continue
    }
    lineStart = mdx.indexOf(valueLine, lineStart)
    const mappingLength = valueLine.length
    const lineEnd = lineStart + mappingLength
    const previousMapping = mappings.at(-1)
    if (previousMapping && previousMapping[2] + previousMapping[3] === lineStart) {
      previousMapping[1] += mappingLength
      previousMapping[3] += mappingLength
    } else {
      mappings.push([result.length, mappingLength, lineStart, mappingLength, 0, 1_048_575])
    }
    result += mdx.slice(lineStart, lineEnd)
  }

  const lastMapping = mappings.at(-1)
  if (lastMapping && lastMapping[2] + lastMapping[3] === end) {
    lastMapping[1] += 1
    lastMapping[3] += 1
  } else {
    mappings.push([result.length, 1, end, 1, 0, 1_048_575])
  }
  result += '}'

  const injectionString = `${componentsNamespace}.`
  let lastIndex = mappings.length - 1
  for (const injectionPoint of injectionPoints.toSorted((a, b) => b - a)) {
    for (let index = lastIndex; index >= 0; index -= 1) {
      const mapping = mappings[index]
      const [virtualStart, mappingLength, originalStart] = mapping
      if (injectionPoint < originalStart) {
        lastIndex = index
        break
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

  return [result, mappings]
}

/**
 * @param {Nodes} node
 * @param {string} mdx
 * @returns {number}
 */
export function getListItemMarkerLength(node, mdx) {
  const start = getNodeStartOffset(node)
  let char = mdx.charAt(start)
  let length = 1
  if (Number.isNaN(Number(char))) {
    return 1
  }

  while (char !== '.') {
    char = mdx.charAt(start + length)
    length += 1
  }

  return length
}
