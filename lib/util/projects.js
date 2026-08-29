/**
 * @import { Root } from 'mdast'
 * @import { Processor } from 'unified'
 * @import { Path } from './misc.js'
 * @import { VirtualCodePluginObject } from './plugin.js'
 * @import { OpenProjectParams, OptionDiagnostic, TransformParams } from '../protocol.js'
 */

import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { Parser } from 'acorn'
import acornJsx from 'acorn-jsx'
import { LooseParser } from 'acorn-loose'
import { resolve } from 'import-meta-resolve'
import defaultmdExtensions from 'markdown-extensions'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import * as messages from './messages.js'
import { isExtension } from './misc.js'
import { knownPlugins } from './plugin.js'

const StrictParser = Parser.extend(acornJsx())

const hybridAcorn = {
  parse: LooseParser.parse.bind(LooseParser),
  parseExpressionAt: StrictParser.parseExpressionAt.bind(StrictParser)
}

/**
 * @typedef Project
 * @property {boolean} checkCodeBlocks
 * @property {boolean} checkMdx
 * @property {string | undefined} configFileName
 * @property {string} jsxImportSource
 * @property {string[]} mdExtensions
 * @property {(params: Pick<TransformParams, 'content' | 'fileName'>) => Root} parse
 * @property {VirtualCodePluginObject[]} plugins
 * @property {string | undefined} providerImportSource
 * @property {'@react-router/fs-routes' | 'next' | undefined} preset
 */

/**
 * @type {Map<string, Project>}
 */
export const projects = new Map()

/**
 * @param {Path} path
 * @param {unknown} value
 * @param {OptionDiagnostic[]} diagnostics
 * @returns {string | undefined}
 */
function checkString(path, value, diagnostics) {
  if (typeof value === 'string') {
    return value
  }

  if (value !== undefined) {
    diagnostics.push(messages.typeError(path, 'string'))
  }
}

/**
 * @param {Path} path
 * @param {unknown} value
 * @param {OptionDiagnostic[]} diagnostics
 * @returns {boolean}
 */
function checkBoolean(path, value, diagnostics) {
  if (value === true || value === false) {
    return value
  }

  if (value !== undefined) {
    diagnostics.push(messages.typeError(path, 'boolean'))
  }

  return false
}

/**
 * @param {Path} path
 * @param {unknown} value
 * @param {OptionDiagnostic[]} diagnostics
 * @param {unknown[]} defaultValue
 * @returns {unknown[]}
 */
function checkArray(path, value, diagnostics, defaultValue) {
  if (value === undefined) {
    return defaultValue
  }

  if (!Array.isArray(value)) {
    diagnostics.push(messages.typeError(path, 'Array'))
    return defaultValue
  }

  return value
}

/**
 * @template T
 * @param {Path} path
 * @param {unknown} value
 * @param {OptionDiagnostic[]} diagnostics
 * @param {T[]} allowed
 * @returns {T | undefined}
 */
function checkEnum(path, value, diagnostics, allowed) {
  if (value === undefined) {
    return
  }

  if (/** @type {unknown[]} */ (allowed).includes(value)) {
    return /** @type {T} */ (value)
  }

  diagnostics.push(messages.enumError(path, allowed))
}

/**
 * @param {unknown} value
 * @param {OptionDiagnostic[]} diagnostics
 * @returns {string[]}
 */
function checkmdExtensions(value, diagnostics) {
  const array = checkArray(
    ['mdExtensions'],
    value,
    diagnostics,
    defaultmdExtensions.map((ext) => `.${ext}`)
  )

  return /** @type {string[]} */ (
    array.filter((item, index) => {
      const string = checkString(['mdExtensions', index], item, diagnostics)
      if (string === undefined) {
        return false
      }

      if (isExtension(string)) {
        return true
      }

      diagnostics.push(messages.expectExtension(['mdExtensions', index], string))
      return false
    })
  )
}

/**
 * @param {Path} path
 * @param {unknown} value
 * @param {string} configFileName
 * @param {OptionDiagnostic[]} diagnostics
 * @param {Processor<Root>[]} [processors]
 * @returns {Promise<VirtualCodePluginObject[]>}
 */
async function checkPluginArray(path, value, configFileName, diagnostics, processors) {
  const array = checkArray(path, value, diagnostics, [])

  const plugins = await Promise.all(
    array.map(async (maybeTuple, index) => {
      const namePath = [...path, index]

      /** @type {string} */
      let name

      /** @type {unknown} */
      let options

      if (typeof maybeTuple === 'string') {
        name = maybeTuple
      } else if (Array.isArray(maybeTuple)) {
        ;[name, options] = maybeTuple
        namePath.push(0)
        if (!checkString(namePath, name, diagnostics)) {
          return
        }
      } else {
        diagnostics.push(messages.typeError(namePath, 'string or Array'))
        return
      }

      const knownPlugin = knownPlugins.get(name)
      if (knownPlugin) {
        return knownPlugin(options)
      }

      if (!processors) {
        diagnostics.push(messages.unknownPluginError(namePath, name))
        return
      }

      if (!configFileName) {
        return
      }

      try {
        const parent = String(pathToFileURL(configFileName))
        const url = resolve(name, parent)
        const { default: plugin } = await import(url)
        for (const processor of processors) {
          processor.use(plugin, options)
        }
      } catch {
        diagnostics.push(messages.unresolvedPluginError(namePath, name))
      }
    })
  )

  return plugins.filter((plugin) => plugin != null)
}

/**
 * @param {Omit<OpenProjectParams, 'projectHandle'>} params
 * @returns {Promise<[Project, OptionDiagnostic[]]>}
 */
export async function normalizeOptions({ compilerOptions, configFileName, options = {} }) {
  /** @type {OptionDiagnostic[]} */
  const diagnostics = []

  const markdownProcessor = unified().use(remarkParse)
  const mdxProcessor = unified().use(remarkParse).use(remarkMdx, { acorn: hybridAcorn })

  let { jsxImportSource } = compilerOptions
  if (typeof jsxImportSource !== 'string') {
    jsxImportSource = 'react'
  }

  const checkMdx = checkBoolean(['checkMdx'], options.checkMdx, diagnostics)
  if (checkMdx && !compilerOptions.allowJs) {
    diagnostics.push(messages.dependsCompilerOption(['checkMdx'], 'allowJs'))
  }

  const mdExtensions = checkmdExtensions(options.mdExtensions, diagnostics)

  const plugins = await Promise.all([
    checkPluginArray(['remarkPlugins'], options.remarkPlugins, configFileName, diagnostics, [
      markdownProcessor,
      mdxProcessor
    ]),
    checkPluginArray(['rehypePlugins'], options.rehypePlugins, configFileName, diagnostics),
    checkPluginArray(['recmaPlugins'], options.recmaPlugins, configFileName, diagnostics)
  ])

  /** @type {Project} */
  const project = {
    checkCodeBlocks: checkBoolean(['checkCodeBlocks'], options.checkCodeBlocks, diagnostics),
    checkMdx,
    configFileName: configFileName || undefined,
    jsxImportSource,
    mdExtensions,
    parse({ content, fileName }) {
      const processor = mdExtensions.includes(extname(fileName)) ? markdownProcessor : mdxProcessor
      return processor.parse({ path: fileName, value: content })
    },
    plugins: plugins.flat(),
    preset: checkEnum(['preset'], options.preset, diagnostics, ['@react-router/fs-routes', 'next']),
    providerImportSource: checkString(
      ['providerImportSource'],
      options.providerImportSource,
      diagnostics
    )
  }

  return [project, diagnostics]
}
