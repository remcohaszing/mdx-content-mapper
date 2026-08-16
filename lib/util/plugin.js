/**
 * @import { Nodes } from 'mdast'
 * @import { Processor } from 'unified'
 * @import { SpanMapping } from '../protocol.js'
 */

/**
 * @typedef VirtualCodePluginObject
 *   An object returned by a virtual code plugin.
 * @property {(node: Nodes) => undefined} [visit]
 *   Visit an mdast node.
 * @property {() => [string, SpanMapping[]]} finalize
 *   Generate the JavaScript string to insert into the virtual code.
 */

/**
 * @typedef {(options: unknown) => VirtualCodePluginObject} VirtualCodePlugin
 *   An internal plugin for MDX analyzer that represents an MDX plugin.
 */

/** @type {Map<string, VirtualCodePlugin>} */
const knownPlugins = new Map()

/**
 * Register a well-known MDX plugin.
 *
 * @param {string} name
 * @param {VirtualCodePlugin} plugin
 */
export function definePlugin(name, plugin) {
  knownPlugins.set(name, plugin)
}

/**
 * @param {Processor<Nodes>} processor
 * @param {unknown} pluginArray
 * @returns {Promise<VirtualCodePluginObject[]>}
 */
async function resolvePluginArray(processor, pluginArray) {
  /** @type {VirtualCodePluginObject[]} */
  const plugins = []

  if (!Array.isArray(pluginArray)) {
    return plugins
  }

  for (const maybeTuple of pluginArray) {
    const [name, options] = Array.isArray(maybeTuple) ? maybeTuple : [maybeTuple]
    if (typeof name !== 'string') {
      continue
    }

    const knownPlugin = knownPlugins.get(name)
    if (knownPlugin) {
      plugins.push(knownPlugin(options))
      continue
    }

    const { default: plugin } = await import(name)
    processor.use(plugin, options)
  }

  return plugins
}

/**
 * @param {Processor<Nodes>} processor
 * @param {unknown} options
 * @returns {Promise<VirtualCodePluginObject[]>}
 */
export async function resolvePlugins(processor, options) {
  /** @type {VirtualCodePluginObject[]} */
  const plugins = []

  if (!options) {
    return plugins
  }

  if (typeof options !== 'object') {
    return plugins
  }

  if ('remarkPlugins' in options) {
    plugins.push(...(await resolvePluginArray(processor, options.remarkPlugins)))
  }

  if ('rehypePlugins' in options) {
    plugins.push(...(await resolvePluginArray(processor, options.rehypePlugins)))
  }

  if ('recmaPlugins' in options) {
    plugins.push(...(await resolvePluginArray(processor, options.recmaPlugins)))
  }

  return plugins
}
