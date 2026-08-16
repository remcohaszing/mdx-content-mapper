import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter
} from 'vscode-jsonrpc/node'

import { initialize } from './requests/initialize.js'
import { transform } from './requests/transform.js'

const connection = createMessageConnection(
  new StreamMessageReader(process.stdin),
  new StreamMessageWriter(process.stdout)
)

connection.onRequest('initialize', initialize)
connection.onRequest('transform', transform)

connection.listen()
