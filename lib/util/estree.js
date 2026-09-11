/**
 * @import {Node} from 'estree-jsx'
 */

/**
 * @param {Node} node
 * @returns {boolean}
 */
export function isFunctionNode(node) {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  )
}

/**
 * @param {Node} node
 * @returns {boolean}
 */
export function isAwaitNode(node) {
  return node.type === 'AwaitExpression' || (node.type === 'ForOfStatement' && node.await)
}
