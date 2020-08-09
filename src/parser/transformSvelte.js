import {analyzeScript} from "./babel/prepareScriptTag.js"
import {transformGetter} from "./babel/transformGetter.js"
import {transformSetter} from "./babel/transformSetter.js"
import {parseSvelte} from "./parseSvelte.js"
import {enterScope, exitScope, initReactive, setReactive} from "./table/reactives.js"


const quote = (str) => `'${String(str).replace(/\n/g, "\\n").replace(/'/g, "\\x27")}'`

const generateWatch = (source) => {
  const output = transformGetter(source)
  const ast = output.ast.program.body[0]
  ast.code = output.code
  const [index, node] = setReactive(output.code, ast)

  return callback => () => {
    return callback(`watch(${index}, ${node.mask})`)
  }
}

const generateSetter = (source) => {
  const output = transformSetter(source)
  const ast = output.ast.program.body[0]
  ast.code = output.code
  const [index, node] = setReactive(output.code, output.ast.program.body[0])
  return `setter(${index})`
}

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
          if (isComponent) return generateWatch(source)(watch => watch + '(' + generateSetter(source) + `($prop(${quote(name)})))`)
          return generateWatch(source)(watch => watch + `($attr(${quote(name)}))`)
        }

        if (prefix === "on") {
          // const {index} = transformGetter(source)
          // return `on('${name2}', ${index})`
          return
        }

        if (prefix === "class") {
          return generateWatch(source)(watch => watch + `($class(${quote(name2)}))`)
        }

        if (prefix === "bind") {
          let w = generateWatch(source)
          let s = generateSetter(source)
          return w(watch => watch + '(' + s + `($bind(${quote(name2)})))`)
        }

        throw new TypeError('not defined! ' + prefix, name2, name)
      }

      case "ws": {
        return scopeCount === 0 ? '' : `text(${quote(textContent)})`
      }

      case "text": {
        if (isWatch) {
          const source = value.slice(1, -1).trim()
          return generateWatch(source)(watch => watch + `($text)`)
        }

        return `text(${quote(textContent)})`
      }

      case "logicBlockOpenStart": {
        tagName = tagName.replace(/\s+/g, " ").trim()

        switch (tagName) {
          case "#if": {
            return generateWatch(`!!(${value})`)(watch => `\nIf(${watch}, fragment(`)
          }

          case ":else if": {
            return generateWatch(`!!(${value})`)(watch => `),\n${watch}, fragment(`)
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
        return w(watch => `\neach(${scopeId}, ${watch}, fragment(`)
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


  const createCode = () => {
    codes = codes.filter(a => a).map(a => typeof a === "function" ? a() : a)

    console.table(codes)

    codes = codes
      .map((a, index, A) => (a.startsWith(")") || (A[index - 1] && A[index - 1].endsWith("(")) ? a : ',' + a))
      .join("")

    codes = `createComponent(createInstance${codes})(arguments[0])`

    return codes
  }

  const output = analyzeScript(scriptContent, reactive, createCode)


  console.log(codes)
  console.table(reactive)

  console.log(output.code)


  return output.code
}


export function transformSvelte(source) {
  const [tokens, paths] = parseSvelte(source)
  return transform(paths)
}