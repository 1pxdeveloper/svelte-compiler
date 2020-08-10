import {transformScript} from "./babel/scriptTag.js"
import {transformGetter} from "./babel/transformGetter.js"
import {transformSetter} from "./babel/transformSetter.js"
import {parseSvelte} from "./parseSvelte.js"
import {enterScope, exitScope, initReactive, setReactive} from "./table/reactives.js"
import {analyzeScript} from "./babel/scriptTagProps"


const quote = (str) => `'${String(str).replace(/\n/g, "\\n").replace(/'/g, "\\x27")}'`

const generateWatch = (source) => {
  const output = transformGetter(source)
  const ast = output.ast.program.body[0]
  const index = setReactive(output.code, ast)
  return `watch(${index})`
}

const generateSetterIndex = (source) => {
  const output = transformSetter(source)
  const ast = output.ast.program.body[0]
  return setReactive(output.code, ast)
}

const generateSetter = (source) => `setter(${generateSetterIndex(source)})`


export function transform(paths) {

  const reactive = initReactive()

  let scopeCount = 0
  let isComponent = false
  let scriptContent = ''

  let codes = paths.map(({type, tagName, name, value, textContent, isWatch}) => {
    switch (type) {
      case "rawTextElement": {
        scriptContent += textContent
        return ""
      }

      case "elementOpen": {
        scopeCount++
        if (tagName.charAt(0).toUpperCase() === tagName.charAt(0)) {
          isComponent = true
          return `\ncomponent(${tagName}`
        }

        isComponent = false
        return `\nelement(${quote(tagName)}`
      }

      case "elementClose": {
        scopeCount--
        return `)`
      }

      case "attr": {

        /// attr="value" 형태
        if (!isWatch) return `attr(${quote(name)}, ${quote(value)})`

        const [prefix, name2] = name.split(":", 2)
        const source = value.slice(1, -1)

        /// attr={value} 형태
        if (!name2) {
          return generateWatch(source) + `($attr(${quote(name)}))`
        }

        if (prefix === "on") {
          // const {index} = transformGetter(source)
          // return `on('${name2}', ${index})`
          return
        }

        if (prefix === "class") {
          return generateWatch(source) + `($class(${quote(name2)}))`
        }

        if (prefix === "bind") {
          let w = generateWatch(source)
          let s = generateSetter(source)
          return w + '(' + s + `($bind(${quote(name2)})))`
        }

        throw new TypeError('not defined! ' + prefix, name2, name)
      }

      case "ws": {
        return scopeCount === 0 ? '' : `text(${quote(textContent)})`
      }

      case "text": {
        if (isWatch) {
          const source = value.slice(1, -1).trim()
          return generateWatch(source) + `($text)`
        }

        return `text(${quote(textContent)})`
      }

      case "logicBlockOpenStart": {
        tagName = tagName.replace(/\s+/g, " ").trim()

        switch (tagName) {
          case "#if": {
            return `\nIf` + generateWatch(`!!(${value})`) + `, fragment(`
          }

          case ":else if": {
            return `),\n` + generateWatch(`!!(${value})`) + `, fragment(`
          }

          case ":else": {
            return '),0,fragment('
          }
        }

        throw new TypeError('not supported! ' + tagName)
      }

      /// {#each ... as row, index (key)}
      case "each": {
        const watch = generateWatch(name)
        const scopeId = enterScope(value)
        return `\neach(${scopeId}, ${watch}, fragment(`
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
  codes = codes.map((a, index, A) => (a.startsWith(")") || (A[index - 1] && A[index - 1].endsWith("(")) ? a : ',' + a)).join("")
  codes = `createComponent(createInstance${codes})(...arguments)`

  let props = Object.create(null)
  analyzeScript(scriptContent, generateSetterIndex, props)
  const output = transformScript(scriptContent, reactive, codes, props)


  console.table(reactive)
  console.log(output.code)

  return output.code
}


export function transformSvelte(source) {
  const [tokens, paths] = parseSvelte(source)
  return transform(paths)
}