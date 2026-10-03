/**
 * @import { MappedOutput } from '../lib/protocol.js'
 * @import { Root, RootContent } from 'mdast'
 */

import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

import { includeKeys } from 'filter-obj'
import { toMarkdown } from 'mdast-util-to-markdown'
import { assertEqual, testFixturesDirectory } from 'snapshot-fixtures'
import typescript from 'typescript'

import { closeProject } from '../lib/requests/close-project.js'
import { openProject } from '../lib/requests/open-project.js'
import { transform } from '../lib/requests/transform.js'
import pkg from '../package.json' with { type: 'json' }

const directory = new URL('../fixtures/', import.meta.url)

/**
 * Render mapped output to markdown.
 *
 * @param {string} original
 *   The original content.
 * @param {MappedOutput} output
 *   The content provided by the content mapper.
 * @returns {RootContent[]}
 *   A markdown representation of the mapped output.
 */
function mappedOutputToMdast(original, output) {
  const { extension, mappings, text } = output

  assert.ok(mappings)

  /** @type {RootContent[]} */
  const verbatimMappings = []

  /** @type {RootContent[]} */
  const nonVerbatimMappings = []

  for (const mapping of mappings) {
    const [generatedStart, generatedLength, originalStart, originalLength, kind] = mapping
    const generatedSlice = text.slice(generatedStart, generatedStart + generatedLength)
    const originalSlice = original.slice(originalStart, originalStart + originalLength)
    if (kind === 0) {
      assertEqual(generatedSlice, originalSlice)
      verbatimMappings.push({
        type: 'code',
        lang: 'jsx',
        meta: mapping.join(' '),
        value: generatedSlice
      })
    } else {
      if (nonVerbatimMappings.length) {
        nonVerbatimMappings.push({ type: 'thematicBreak' })
      }
      nonVerbatimMappings.push(
        {
          type: 'code',
          lang: 'plaintext',
          meta: `${originalStart} ${originalLength}`,
          value: originalSlice
        },
        {
          type: 'code',
          lang: 'jsx',
          meta: `${generatedStart} ${generatedLength}`,
          value: generatedSlice
        }
      )
    }
  }

  return [
    { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Text' }] },
    { type: 'code', lang: extension.slice(1), value: text },
    { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Verbatim mappings' }] },
    ...verbatimMappings,
    { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Non-verbatim mappings' }] },
    ...nonVerbatimMappings
  ]
}

let count = 0

testFixturesDirectory({
  directory,
  write: true,
  tests: {
    async 'readme.md'(file) {
      const original = String(file)
      const dir = dirname(file.path)
      const tsconfigFileName = join(dir, 'tsconfig.json')
      const configSourceFile = typescript.readJsonConfigFile(
        tsconfigFileName,
        typescript.sys.readFile
      )
      const { options, raw } = typescript.parseJsonSourceFileConfigFileContent(
        configSourceFile,
        typescript.sys,
        dir,
        undefined,
        tsconfigFileName
      )
      const mdxContentMapper = /** @type {any[]} */ (raw.contentMappers).find(
        (contentMapper) => contentMapper.package === pkg.name
      )
      count += 1
      const projectHandle = `${pkg.name}@${pkg.version}:${count}`
      await openProject({
        configFileName: tsconfigFileName,
        compilerOptions: includeKeys(options, pkg.typescript.contentMapper.compilerOptions),
        options: mdxContentMapper.options,
        projectHandle
      })
      const result = transform({
        content: original,
        fileName: file.path,
        projectHandle
      })
      closeProject({ projectHandle })

      /** @type {Root} */
      const root = {
        type: 'root',
        children: [
          ...mappedOutputToMdast(original, result),
          { type: 'heading', depth: 2, children: [{ type: 'text', value: 'Diagnostics' }] }
        ]
      }

      if (result.diagnostics) {
        root.children.push({
          type: 'list',
          children: result.diagnostics.map((diagnostic) => ({
            type: 'listItem',
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'inlineCode', value: `${diagnostic.start}:${diagnostic.length}` },
                  { type: 'text', value: ': ' },
                  { type: 'inlineCode', value: diagnostic.messageText }
                ]
              }
            ]
          }))
        })
      }

      if (result.supplemental) {
        for (const supplemental of result.supplemental) {
          root.children.push(...mappedOutputToMdast(original, supplemental))
        }
      }

      return toMarkdown(root, { bullet: '-', emphasis: '_' })
    }
  }
})

test('tsconfig.json', async () => {
  const names = await readdir(directory)
  const actual = await readFile(new URL('tsconfig.json', directory), 'utf8')
  const expected = [
    '{',
    '  "files": [],',
    '  "references": [',
    names
      .filter((name) => name !== 'tsconfig.json')
      .sort()
      .map((name) => `    { "path": "./${name}/tsconfig.json" }`)
      .join(',\n'),
    '  ]',
    '}',
    ''
  ].join('\n')

  assertEqual(actual, expected)
})
