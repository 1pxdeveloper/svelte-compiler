import {initIndentifiers, setIndentifiers} from "./table/identifiers.js"
import {transformReactive} from "./babel/reactive.js"
import {analyzeScript, transformScript} from "./babel/scriptTag.js"
import {parseSvelte} from "./parseSvelte.js"
import {initReactive, setReactive} from "./table/reactives.js"
import {clearIndentifiers} from "./table/identifiers"


const quote = (str) => `'${String(str).replace(/\n/g, "\\n").replace(/'/g, "\\x27")}'`

const generateWatch = (source, mutableTable) => {
  const {index, identifiers_mask} = transformReactive(source, mutableTable)
  return `, watch(${index}, ${identifiers_mask})`
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

  console.log("------------------- mutableTable ---------------------")
  console.table(mutableTable)

  let ifCode

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

        if (!isWatch) {
          return `, attr(${quote(name)}, ${quote(value)})`
        }

        const source = value.slice(1, -1)

        if (!name2) {
          return generateWatch(source, mutableTable) + `(attr(${quote(name)}))`
        }

        if (prefix === "on") {
          const {code, index, identifiers_mask} = transformReactive(source, mutableTable)
          return `, on('${name2}', ${index})`
        }

        if (prefix === "class") {
          return generateWatch(source, mutableTable) + `(classList(${quote(name2)}))`
        }

        throw new TypeError('not defined! ' + prefix, name2, name)
      }

      case "text": {
        if (isWatch) {
          const source = value.slice(1, -1).trim()
          return generateWatch(source, mutableTable) + `(text())`
        }

        return `, text(${quote(textContent)})`
      }

      case "blockOpenStart": {
        tagName = tagName.replace(/\s+/g, " ").trim()

        switch (tagName) {
          case "#if": {
            ifCode = generateWatch(`!!(${value})`, mutableTable)
            return ifCode + `($if(0`
          }

          case ":else if": {
            return '))' + ifCode + `($if(1`
          }

          case ":else": {
            return '))' + ifCode + `($if(1`
          }
        }

        throw new TypeError('not supported! ' + tagName)
      }

      case "blockCloseStart": {
        ifCode = null
        return `))`
      }
    }

    return ''
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