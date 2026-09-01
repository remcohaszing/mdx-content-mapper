/**
 * @import { Code, Nodes } from 'mdast'
 * @import { Node, Point } from 'unist'
 * @import { MappedOutput, SpanMapping } from '../protocol.js'
 */

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
