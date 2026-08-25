import nextMdx from '@next/mdx'

const withMdx = nextMdx()

export default withMdx({
  pageExtensions: ['mdx', 'ts', 'tsx']
})
