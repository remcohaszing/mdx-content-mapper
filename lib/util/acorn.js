import { Parser } from 'acorn'
import jsx from 'acorn-jsx'
import { LooseParser } from 'acorn-loose'

const StrictParser = Parser.extend(jsx())

export const acorn = {
  parse: LooseParser.parse.bind(LooseParser),
  parseExpressionAt: StrictParser.parseExpressionAt.bind(StrictParser)
}
