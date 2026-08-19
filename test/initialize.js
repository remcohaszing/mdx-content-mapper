import assert from 'node:assert/strict'
import { test } from 'node:test'

import { initialize } from '../lib/requests/initialize.js'

test('initialize', () => {
  const result = initialize()

  assert.deepEqual(result, {
    protocolVersion: 1,
    positionEncoding: 'utf-16',
    diagnosticSource: 'MDX'
  })
})
