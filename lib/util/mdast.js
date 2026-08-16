/**
 * @import { Nodes} from 'mdast'
 * @import { Point } from 'unist'
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
 * @param {Nodes} node
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
 * @param {Nodes} node
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
