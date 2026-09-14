/**
 * @import { Token } from 'micromark-util-types'
 * @import { Chunk } from './chunk.js'
 */

/**
 * @typedef VirtualCodePluginObject
 *   An object returned by a virtual code plugin.
 * @property {(token: Token) => string | undefined} [enter]
 * @property {(token: Token) => string | undefined} [exit]
 * @property {() => undefined} [finalize]
 */

/**
 * @callback VirtualCodePluginFunction
 * @param {string} content
 * @param {Chunk} esm
 * @returns {VirtualCodePluginObject}
 */

/**
 * @callback VirtualCodePlugin
 * An internal plugin for MDX analyzer that represents an MDX plugin.
 * @param {unknown} options
 * @returns {VirtualCodePluginFunction}
 */

/** @type {Map<string, VirtualCodePlugin>} */
export const knownPlugins = new Map()

/**
 * Register a well-known MDX plugin.
 *
 * @param {string} name
 * @param {VirtualCodePlugin} plugin
 */
export function definePlugin(name, plugin) {
  knownPlugins.set(name, plugin)
}
