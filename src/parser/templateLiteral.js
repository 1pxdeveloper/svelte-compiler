import {transformReactive} from "./reactive.js"
import {parseSvelte} from "./svelte.js"
import {setIndentifiers} from "./table/identifiers.js"
import {setReactive} from "./table/reactives.js"

export const transformTemplateLiteral = source => {
  const [tokens, paths] = parseTemplate(source)

  let codes = paths.map(path => {
    switch (path.type) {
      case "identifier_block":
      case "blocks":
        const {code, identifiers_mask} = transformReactive(path.code.slice(1, -1), mutableTable)
        const index = setReactive(code)
        return `, watch(text(), ${index}, ${identifiers_mask})`

      default:
        return path.value
    }
  })


}

