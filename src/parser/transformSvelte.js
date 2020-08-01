import {initIndentifiers, setIndentifiers} from "./table/identifiers.js"
import {transformReactive} from "./babel/reactive.js"
import {analyzeScript, transformScript} from "./babel/scriptTag.js"
import {parseSvelte} from "./parseSvelte.js"
import {enterScope, exitScope, initReactive, setReactive} from "./table/reactives.js"
import {clearIndentifiers} from "./table/identifiers"


const quote = (str) => `'${String(str).replace(/\n/g, "\\n").replace(/'/g, "\\x27")}'`

const createGenerateWatch = (mutableTable) => (source) => {
  const {index, identifiers_mask} = transformReactive(source, mutableTable)
  return `watch(${index}, ${identifiers_mask})`
}


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

  const generateWatch = createGenerateWatch(mutableTable)

  console.log("------------------- mutableTable ---------------------")
  console.table(mutableTable)

  let scopeCount = 0

  let codes = paths.map(({type, tagName, name, value, textContent, isWatch}) => {
    switch (type) {
      case "rawTextElement": {
        scriptContent = textContent
        return ""
      }

      case "elementOpen": {
        scopeCount++
        return `\nelement('${tagName}'`
      }

      case "elementClose": {
        scopeCount--
        return `)`
      }

      case "attr": {
        const [prefix, name2] = name.split(":", 2)

        if (!isWatch) {
          return `attr(${quote(name)}, ${quote(value)})`
        }

        const source = value.slice(1, -1)

        if (!name2) {
          return generateWatch(source) + `(attr(${quote(name)}))`
        }

        if (prefix === "on") {
          const {index} = transformReactive(source, mutableTable)
          return `on('${name2}', ${index})`
        }

        if (prefix === "class") {
          return generateWatch(source) + `(classList(${quote(name2)}))`
        }

        throw new TypeError('not defined! ' + prefix, name2, name)
      }

      case "ws": {
        return scopeCount === 0 ? '' : `text(${quote(textContent)})`
      }

      case "text": {
        if (isWatch) {
          const source = value.slice(1, -1).trim()
          return generateWatch(source) + `(text())`
        }

        return `text(${quote(textContent)})`
      }

      case "logicBlockOpenStart": {
        tagName = tagName.replace(/\s+/g, " ").trim()

        switch (tagName) {
          case "#if": {
            return `\nIf(` + generateWatch(`!!(${value})`) + ', fragment('
          }

          case ":else if": {
            return '),\n' + generateWatch(`!!(${value})`) + ', fragment('
          }

          case ":else": {
            return '),0,fragment('
          }
        }

        throw new TypeError('not supported! ' + tagName)
      }

      /// {#each ... as row, index (key)}
      case "each": {
        const w = generateWatch(name)
        const scopeId = enterScope(value)
        return `\neach(${scopeId},` + w + ',' + quote(value) + ', fragment('
      }

      case "logicBlockCloseStart": {
        if (tagName === "/each") {
          exitScope()
        }
        return '))'
      }
    }

    return ''
  })


  codes = codes.filter(a => a)

  console.table(codes)

  codes = codes
    .map((a, index, A) => (a.startsWith(")") || (A[index - 1] && A[index - 1].endsWith("(")) ? a : ',' + a))
    .join("")

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