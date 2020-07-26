import {initIndentifiers, setIndentifiers} from "./table/identifiers.js"
import {transformReactive} from "./reactive.js"
import {analyzeScript, transformScript} from "./scriptTag.js"
import {parseSvelte} from "./svelte.js"
import {initReactive, setReactive} from "./table/reactives.js"

export function transform(paths) {

  const identifiers = initIndentifiers()
  const reactive = initReactive()

  let mutableTable = Object.create(null)
  let header = ""
  let scriptContent = ""

  paths.forEach(path => {
    if (path.type === "script") {
      analyzeScript(path.textContent, mutableTable)
    }
  })

  console.log("------------------- mutableTable ---------------------")
  console.table(mutableTable)

  let codes = paths.map(path => {
    switch (path.type) {
      case "script": {
        scriptContent = path.textContent
        return ""
      }

      case "elementOpen": {
        return `,\nelement('${path.tagName}'`
      }

      case "elementClose": {
        return `)`
      }

      case "attr": {
        const {nodeName, nodeValue = ''} = path
        const [prefix, nodeName2] = nodeName.split(":", 2)

        const source = nodeValue.charAt(0) === "{" ? nodeValue.slice(1, -1) : nodeValue
        const {code, identifiers_mask} = transformReactive(source, mutableTable)
        const index = setReactive(code)

        if (!nodeName2) {
          return `, watch(attr('${nodeName}'), ${index}, ${identifiers_mask})`
        }

        if (prefix === "on") {
          return `, on('${nodeName2}', ${index})`
        }

        throw new TypeError('not defined! ' + nodeName)
      }

      case "text": {
        return `, text('${path.nodeValue}')`
      }

      case "identifier_block":
      case "blocks": {
        const source = path.code.slice(1, -1).trim()
        const {code, identifiers_mask} = transformReactive(source, mutableTable)
        const index = setReactive(code)

        return `, watch(text(), ${index}, ${identifiers_mask})`
      }
    }
  }).join("")


  console.log('----- identifiers ----- ')
  console.table(identifiers)

  console.log('----- reactive ----- ')
  console.table(reactive)

  header += transformScript(scriptContent, mutableTable, reactive, identifiers).code

  codes = `${header}\n\nrender(createInstance${codes})(document.body)`
  return codes
}


export function transformSvelte(source) {
  const [tokens, paths] = parseSvelte(source)
  return transform(paths)
}