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
function isAwaitNode(node) {
  return node.type === 'AwaitExpression' || (node.type === 'ForOfStatement' && node.await)
}

/**
 * @param {Node} node
 * @param {Map<Node, Node | null>} parents
 * @returns {boolean}
 */
export function isAsyncMdx(node, parents) {
  if (!isAwaitNode(node)) {
    return false
  }

  for (
    let ancestor = /** @type {Node | null | undefined} */ (node);
    ancestor;
    ancestor = parents.get(ancestor)
  ) {
    if (isFunctionNode(ancestor)) {
      return false
    }
  }

  return true
}
