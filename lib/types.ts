declare module 'estree' {
  interface BaseNode {
    start: number
    end: number
  }
}

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    toml: 'toml'
    tomlFence: 'tomlFence'
    tomlFenceSequence: 'tomlFenceSequence'
    tomlValue: 'tomlValue'
    yaml: 'yaml'
    yamlFence: 'yamlFence'
    yamlFenceSequence: 'yamlFenceSequence'
    yamlValue: 'yamlValue'
  }
}
