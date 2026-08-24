/**
 * @import { Root } from 'mdast'
 * @import { Processor } from 'unified'
 * @import { Path } from './misc.js'
 * @import { VirtualCodePluginObject } from './plugin.js'
 * @import { OpenProjectParams, OptionDiagnostic, TransformParams } from '../protocol.js'
 */

import { extname } from 'node:path'

import defaultMarkdownExtensions from 'markdown-extensions'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import * as messages from './messages.js'
import { isExtension } from './misc.js'
import { knownPlugins } from './plugin.js'

/**
 * @typedef Project
 * @property {boolean} checkCodeBlocks
 * @property {boolean} checkMdx
 * @property {string | undefined} configFileName
 * @property {string} jsxImportSource
 * @property {string[]} markdownExtensions
 * @property {(params: Pick<TransformParams, 'content' | 'fileName'>) => Root} parse
 * @property {VirtualCodePluginObject[]} plugins
 * @property {string | undefined} providerImportSource
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
 * @param {unknown} value
 * @param {OptionDiagnostic[]} diagnostics
 * @returns {string[]}
 */
function checkMarkdownExtensions(value, diagnostics) {
  const array = checkArray(
    ['markdownExtensions'],
    value,
    diagnostics,
    defaultMarkdownExtensions.map((ext) => `.${ext}`)
  )

  return /** @type {string[]} */ (
    array.filter((item, index) => {
      const string = checkString(['markdownExtensions', index], item, diagnostics)
      if (string === undefined) {
        return false
      }

      if (isExtension(string)) {
        return true
      }

      diagnostics.push(messages.expectExtension(['markdownExtensions', index], string))
      return false
    })
  )
}

/**
 * @param {Path} path
 * @param {unknown} value
 * @param {OptionDiagnostic[]} diagnostics
 * @param {Processor<Root>[]} [processors]
 * @returns {Promise<VirtualCodePluginObject[]>}
 */
async function checkPluginArray(path, value, diagnostics, processors) {
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

      try {
        const { default: plugin } = await import(name)
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
  const mdxProcessor = unified().use(remarkParse).use(remarkMdx)

  let { jsxImportSource } = compilerOptions
  if (typeof jsxImportSource !== 'string') {
    jsxImportSource = 'react'
  }

  const checkMdx = checkBoolean(['checkMdx'], options.checkMdx, diagnostics)
  if (checkMdx && !compilerOptions.allowJs) {
    diagnostics.push(messages.dependsCompilerOption(['checkMdx'], 'allowJs'))
  }

  const markdownExtensions = checkMarkdownExtensions(options.markdownExtensions, diagnostics)

  const plugins = await Promise.all([
    checkPluginArray(['remarkPlugins'], options.remarkPlugins, diagnostics, [
      markdownProcessor,
      mdxProcessor
    ]),
    checkPluginArray(['rehypePlugins'], options.rehypePlugins, diagnostics),
    checkPluginArray(['recmaPlugins'], options.recmaPlugins, diagnostics)
  ])

  /** @type {Project} */
  const project = {
    checkCodeBlocks: checkBoolean(['checkCodeBlocks'], options.checkCodeBlocks, diagnostics),
    checkMdx,
    configFileName: configFileName || undefined,
    jsxImportSource,
    markdownExtensions,
    parse({ content, fileName }) {
      const processor = markdownExtensions.includes(extname(fileName))
        ? markdownProcessor
        : mdxProcessor
      return processor.parse({ path: fileName, value: content })
    },
    plugins: plugins.flat(),
    providerImportSource: checkString(
      ['providerImportSource'],
      options.providerImportSource,
      diagnostics
    )
  }

  return [project, diagnostics]
}
