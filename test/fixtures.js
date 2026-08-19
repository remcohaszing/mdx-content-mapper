/**
 * @import { MappedOutput } from '../lib/protocol.js'
 */

import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

import { includeKeys } from 'filter-obj'
import { assertEqual, testFixturesDirectory } from 'snapshot-fixtures'
import typescript from 'typescript'

import { closeProject } from '../lib/requests/close-project.js'
import { openProject } from '../lib/requests/open-project.js'
import { transform } from '../lib/requests/transform.js'
import pkg from '../package.json' with { type: 'json' }

const directory = new URL('../fixtures/', import.meta.url)

/**
 * @param {string} original
 * @param {MappedOutput} output
 * @returns {string}
 */
function mappedOutputToMarkdown(original, output) {
  const { extension, mappings, text } = output

  assert.ok(mappings)
  let verbatimMappingText = ''
  let nonVerbatimMappingText = ''
  for (const mapping of mappings) {
    const [generatedStart, generatedLength, originalStart, originalLength, kind] = mapping
    const generatedSlice = text.slice(generatedStart, generatedStart + generatedLength)
    const originalSlice = original.slice(originalStart, originalStart + originalLength)
    if (kind === 0) {
      assertEqual(generatedSlice, originalSlice)
      verbatimMappingText += '\n```jsx '
      verbatimMappingText += mapping.join(' ')
      verbatimMappingText += '\n'
      verbatimMappingText += generatedSlice
      verbatimMappingText += '\n```\n'
    } else {
      if (nonVerbatimMappingText) {
        nonVerbatimMappingText += '\n---\n'
      }
      nonVerbatimMappingText += '\n```plaintext '
      nonVerbatimMappingText += originalStart
      nonVerbatimMappingText += ' '
      nonVerbatimMappingText += originalLength
      nonVerbatimMappingText += '\n'
      nonVerbatimMappingText += originalSlice
      nonVerbatimMappingText += '\n```\n```jsx '
      nonVerbatimMappingText += generatedStart
      nonVerbatimMappingText += ' '
      nonVerbatimMappingText += generatedLength
      nonVerbatimMappingText += '\n'
      nonVerbatimMappingText += generatedSlice
      nonVerbatimMappingText += '\n```\n'
    }
  }

  return [
    '## Text',
    '',
    `\`\`\`${extension.slice(1)}`,
    text,
    '```',
    '',
    '## Verbatim mappings',
    verbatimMappingText,
    '## Non-verbatim mappings',
    nonVerbatimMappingText
  ].join('\n')
}

let count = 0

testFixturesDirectory({
  directory,
  write: true,
  tests: {
    async 'transform.md'(file) {
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
      openProject({
        configFileName: tsconfigFileName,
        compilerOptions: includeKeys(options, pkg.typescript.contentMapper.compilerOptions),
        options: mdxContentMapper.options,
        projectHandle
      })
      const result = await transform({
        content: original,
        fileName: file.path,
        projectHandle
      })
      closeProject({ projectHandle })

      const diagnosticsTexts =
        result.diagnostics?.map(
          (diagnostic) =>
            `- \`${diagnostic.start}:${diagnostic.length}\`: ${diagnostic.messageText}\n`
        ) ?? []

      return [
        mappedOutputToMarkdown(original, result),
        '## Diagnostics',
        '',
        ...diagnosticsTexts,
        ...(result.supplemental?.map((supplemental) =>
          mappedOutputToMarkdown(original, supplemental)
        ) ?? [])
      ].join('\n')
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
