import {initIndentifiers, setIndentifiers} from "./table/identifiers.js"
import {transformReactive} from "./babel/reactive.js"
import {analyzeScript, transformScript} from "./babel/scriptTag.js"
import {parseSvelte} from "./parseSvelte.js"
import {initReactive, setReactive} from "./table/reactives.js"


const quote = (str) => `'${String(str).replace(/\n/g, "\\n").replace(/'/g, "\\x27")}'`


export function transform(paths) {

  const identifiers = initIndentifiers()
  const reactive = initReactive()

  let mutableTable = Object.create(null)
  let header = ""
  let scriptContent = ""

  paths.forEach(path => {
    if (path.type === "rawTextElement" && path.tagName === "script") {
      analyzeScript(path.textContent, mutableTable)
    }
  })

  console.log("------------------- mutableTable ---------------------")
  console.table(mutableTable)

  let codes = paths.map(({type, tagName, name, value, textContent, isWatch}) => {
    switch (type) {
      case "rawTextElement": {
        scriptContent = textContent
        return ""
      }

      case "elementOpen": {
        return `,\nelement('${tagName}'`
      }

      case "elementClose": {
        return `)`
      }

      case "attr": {
        const [prefix, name2] = name.split(":", 2)

        const source = value.charAt(0) === "{" ? value.slice(1, -1) : value
        const {code, index, identifiers_mask} = transformReactive(source, mutableTable)

        if (!name2) {
          return `, watch(attr('${name}'), ${index}, ${identifiers_mask})`
        }

        if (prefix === "on") {
          return `, on('${name2}', ${index})`
        }

        if (prefix === "class") {
          return `, watch(classList('${name2}'), ${index}, ${identifiers_mask})`
        }

        throw new TypeError('not defined! ' + prefix, name2, name)
      }

      case "text": {
        if (isWatch) {
          const source = value.slice(1, -1).trim()
          const {code, index, identifiers_mask} = transformReactive(source, mutableTable)
          return `, watch(text(), ${index}, ${identifiers_mask})`
        }
        return `, text(${quote(textContent)})`
      }

      case "identifier_block":
      case "blocks": {
        const source = path.code.slice(1, -1).trim()
        const {code, index, identifiers_mask} = transformReactive(source, mutableTable)

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