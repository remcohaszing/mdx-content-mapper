import assert from 'node:assert/strict'
import { test } from 'node:test'

import { closeProject } from '../lib/requests/close-project.js'
import { openProject } from '../lib/requests/open-project.js'
import { projects } from '../lib/util/projects.js'
import pkg from '../package.json' with { type: 'json' }

test('open and close project', () => {
  const projectHandle = `${pkg.name}@${pkg.version}:0`
  const openProjectResult = openProject({
    compilerOptions: {},
    configFileName: 'example/tsconfig.ts',
    projectHandle,
    options: {}
  })

  assert.deepEqual(openProjectResult, {})
  assert.deepEqual(projects.get(projectHandle), {
    compilerOptions: {},
    configFileName: 'example/tsconfig.ts',
    projectHandle,
    options: {}
  })

  closeProject({ projectHandle })
  assert.equal(projects.has(projectHandle), false)
})
