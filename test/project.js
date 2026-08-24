import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { closeProject } from '../lib/requests/close-project.js'
import { openProject } from '../lib/requests/open-project.js'
import { nonNull } from '../lib/util/misc.js'
import { normalizeOptions, projects } from '../lib/util/projects.js'
import pkg from '../package.json' with { type: 'json' }

describe('requests', () => {
  test('open and close project', async () => {
    const projectHandle = `${pkg.name}@${pkg.version}:0`
    const openProjectResult = await openProject({
      compilerOptions: {},
      configFileName: '/example/tsconfig.json',
      projectHandle,
      options: {}
    })

    assert.deepEqual(openProjectResult, { optionDiagnostics: [] })
    const { parse, ...project } = nonNull(projects.get(projectHandle))
    assert.deepEqual(project, {
      checkCodeBlocks: false,
      checkMdx: false,
      configFileName: '/example/tsconfig.json',
      jsxImportSource: 'react',
      markdownExtensions: [
        '.md',
        '.markdown',
        '.mdown',
        '.mkdn',
        '.mkd',
        '.mdwn',
        '.mkdown',
        '.ron'
      ],
      plugins: [],
      providerImportSource: undefined
    })

    closeProject({ projectHandle })
    assert.equal(projects.has(projectHandle), false)
  })
})

describe('normalizeOptions', () => {
  test('default options', async () => {
    const [{ parse, ...project }, diagnostics] = await normalizeOptions({
      configFileName: '/test/tsconfig.json',
      compilerOptions: {}
    })

    assert.deepEqual(project, {
      checkCodeBlocks: false,
      checkMdx: false,
      configFileName: '/test/tsconfig.json',
      jsxImportSource: 'react',
      markdownExtensions: [
        '.md',
        '.markdown',
        '.mdown',
        '.mkdn',
        '.mkd',
        '.mdwn',
        '.mkdown',
        '.ron'
      ],
      plugins: [],
      providerImportSource: undefined
    })
    assert.deepEqual(diagnostics, [])
    assert.equal(typeof parse, 'function')
  })

  describe('checkCodeBlocks', () => {
    test('allowJs true', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          checkCodeBlocks: true
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: true,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [])
    })

    test('non boolean', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          checkCodeBlocks: 'this is not a boolean'
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [
        {
          code: 1001,
          messageText: "Content mapper option 'checkCodeBlocks' requires a value of type boolean.",
          path: ['checkCodeBlocks']
        }
      ])
    })
  })

  describe('checkMdx', () => {
    test('allowJs false', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          checkMdx: true
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: true,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [
        {
          code: 1002,
          messageText:
            "Content mapper option 'checkMdx' cannot be specified without specifying compiler option 'allowJs'.",
          path: ['checkMdx']
        }
      ])
    })

    test('allowJs true', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {
          allowJs: true
        },
        options: {
          checkMdx: true
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: true,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [])
    })

    test('non boolean', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          checkMdx: 'this is not a boolean'
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [
        {
          code: 1001,
          messageText: "Content mapper option 'checkMdx' requires a value of type boolean.",
          path: ['checkMdx']
        }
      ])
    })
  })

  describe('configFileName', () => {
    test('non-empty', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/path/to/tsconfig.json',
        compilerOptions: {}
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/path/to/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [])
    })

    test('empty', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '',
        compilerOptions: {}
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: undefined,
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [])
    })
  })

  describe('jsxImportSource', () => {
    test('string', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {
          jsxImportSource: 'preact'
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'preact',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [])
    })

    test('non-string', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {
          jsxImportSource: undefined
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [])
    })
  })

  describe('markdownExtensions', () => {
    test('non-array', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          markdownExtensions: '.md'
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })

      const content = '{a}'
      assert.deepEqual(
        parse({ fileName: '/test/file.mdx', content }).children[0].type,
        'mdxFlowExpression'
      )
      assert.deepEqual(
        parse({ fileName: '/test/file.markdown', content }).children[0].type,
        'paragraph'
      )

      assert.deepEqual(diagnostics, [
        {
          code: 1001,
          messageText: "Content mapper option 'markdownExtensions' requires a value of type Array.",
          path: ['markdownExtensions']
        }
      ])
    })

    test('array', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          markdownExtensions: ['.md', 'markdown', { ext: '.mkd' }]
        }
      })

      const content = '{a}'
      assert.deepEqual(
        parse({ fileName: '/test/file.markdown', content }).children[0].type,
        'mdxFlowExpression'
      )
      assert.deepEqual(parse({ fileName: '/test/file.md', content }).children[0].type, 'paragraph')

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: ['.md'],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [
        {
          code: 1003,
          messageText: "File extension 'markdown' must begin with a '.'.",
          path: ['markdownExtensions', 1]
        },
        {
          code: 1001,
          messageText:
            "Content mapper option 'markdownExtensions[2]' requires a value of type string.",
          path: ['markdownExtensions', 2]
        }
      ])
    })
  })

  describe('providerImportSource', () => {
    test('string', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          providerImportSource: './mdx-components.tsx'
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: './mdx-components.tsx'
      })
      assert.deepEqual(diagnostics, [])
    })

    test('non-string', async () => {
      const [{ parse, ...project }, diagnostics] = await normalizeOptions({
        configFileName: '/test/tsconfig.json',
        compilerOptions: {},
        options: {
          providerImportSource: true
        }
      })

      assert.deepEqual(project, {
        checkCodeBlocks: false,
        checkMdx: false,
        configFileName: '/test/tsconfig.json',
        jsxImportSource: 'react',
        markdownExtensions: [
          '.md',
          '.markdown',
          '.mdown',
          '.mkdn',
          '.mkd',
          '.mdwn',
          '.mkdown',
          '.ron'
        ],
        plugins: [],
        providerImportSource: undefined
      })
      assert.deepEqual(diagnostics, [
        {
          code: 1001,
          messageText:
            "Content mapper option 'providerImportSource' requires a value of type string.",
          path: ['providerImportSource']
        }
      ])
    })
  })
})
