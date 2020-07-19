<script>
import {Observable} from "./1px/observable"
import {onMount} from "svelte"

const createEscapeOneLineRegexp = (open, close = open, ...blocks) => new RegExp(`${open}(?:${blocks.map(b => b + '|').join('')}\\\\.|[^\\\\${close}\n])*${close}`)
const identifier = /(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*/u

const string1 = createEscapeOneLineRegexp('"')
const string2 = createEscapeOneLineRegexp("'")
const string3 = createEscapeOneLineRegexp("`")
const regexp_bracket = createEscapeOneLineRegexp("\\[", "\\]")
const regexp = createEscapeOneLineRegexp("\\/", "\\/", regexp_bracket.source)
const open_script = /<script(?=[\s>])/
const close_script = /<\/script\s*>/
const open_tag = /<[^\s/>]+/
const close_tag = /<\/[^\s>]+\s*>/
const content = /[^\s"'`<>/={}]+/
const operator = /\/>|[={}>]/

const lex = [
  ["(open_script)", open_script],
  ["(close_script)", close_script],
  ["(open_tag)", open_tag],
  ["(close_tag)", close_tag],
  ["(string)", string1],
  ["(string)", string2],
  ["(template)", string3],
  ["(regexp)", regexp],
  ["(text)", content],
  ["(operator)", operator],
  ["(ws)", /\s+/],
  ["(unknown)", /./],
]

const re = new RegExp(lex.map(([type, regexp]) => "(" + regexp.source + ")").join("|"), "gu")

const createToken = (id, value) => ({id, value})

function tokenize(re, text) {
  let res = []

  text.replace(re, (value, ...args) => {
    const index = args.indexOf(value)
    const type = lex[index][0]

    switch (type) {
      case "(open_tag)":
        res.push(createToken(type, value.slice(1)))
        return value

      case "(close_tag)":
        res.push(createToken(type, value.slice(2, -1).trim()))
        return value

      case "(string)":
        res.push(createToken(type, value.slice(1, -1)))
        return value

      case "(operator)":
        res.push(createToken(value, value))
        return value
    }

    res.push(createToken(type, value))
    return value
  })

  return res
}


let index = 0
let token

function next(id) {
  if (id && token && token.id !== id) {
    throw new Error("Unexpected token: " + token.id + ", not " + id)
  }

  const t = token
  token = tokens[index++] || null
  return t
}

function nextUntil(...ids) {
  let res = ""
  while (!ids.includes(token.id)) {
    res += next().value
  }
  return res
}

function skip(id) {
  if (token && token.id === id) {
    next()
  }
}

let paths = []

function createPath(type) {
  const path = {type}
  paths.push(path)
  return path
}

function svelte() {
  next()
  for (let i = 0; i < 200; i++) {
    skip("(ws)")
    if (!token) break
    script() || element() || blocks() || textNode()
  }
  skip("(ws)")
}


function script() {
  if (token.id === "(open_script)") {
    const path = createPath("script")
    path.text = nextUntil("(close_script)")
    next()
    return true
  }
  return false
}

function element() {
  if (token.id === "(open_tag)") return elementOpen()
  if (token.id === "(close_tag)") return elementClose()
  return false
}

function blocks() {
  if (token.id !== "{") return false
  const path = createPath("blocks")
  path.code = brace()
  return true
}

function textNode() {
  if (token.id !== "(text)") return false
  const path = createPath("text")
  path.code = nextUntil("(open_tag)", "(close_tag)", "{", "(open_script)")
  return true
}


function elementOpen() {
  const path = createPath("elementOpen")

  skip("(ws)")
  path.tagName = next().value
  skip("(ws)")

  while (token && token.id === "(text)") {
    attr()
    skip("(ws)")
  }

  skip("(ws)")

  if (token.id === "/>") {
    const path2 = createPath("elementClose")
    path2.tagName = path.tagName
    next()
  }

  if (token.id === ">") next()
  return true
}

function elementClose() {
  const path = createPath("elementClose")
  skip("(ws)")
  path.tagName = next().value
  return true
}


function attr() {
  const path = createPath("attr")
  path.nodeName = next("(text)").value

  skip("(ws)")
  if (token.id === "=") next()
  skip("(ws)")

  if (token.id === "(string)") path.nodeValue = next().value
  else if (token.id === "{") path.nodeValue = brace()
}

function brace() {
  let ret = "{"

  next("{")
  ret += nextUntil("{", "}")

  if (token.id === "{") {
    ret += brace()
  }

  ret += nextUntil("}")
  next("}")

  ret += "}"
  return ret
}

let text = ""
let tokens = []

function parse() {
  tokens = tokenize(re, text)
  index = 0
  paths = []

  try {
    svelte()
  } catch (e) { console.error(e) }

  paths = paths

  let codes = paths.map(path => {
    switch (path.type) {
      case "elementOpen": {
        return `,\nelement('${path.tagName}'`
      }

      case "elementClose": {
        return `)`
      }

      case "attr": {
        return `, attr('${path.nodeName}', '${path.nodeValue}')`
      }

      case "blocks": {
        return `, blocks('${path.code}')`
      }
    }
  }).join("")


  console.log("render(1" + codes + ")")
}


function render() {

}


// render(1,
//   element('main', attr('id', 'template'),
//     element('h1', blocks('{name}')),
//     element('div', attr('style', 'display: flex'),
//       element('textarea', attr('test2', '{  {a:100, b:500}   }'), attr('test', '12312321'), attr('cols', '80'), attr('rows', '45'), attr('bind:value', '{text}'), attr('on:input', '{parse}')),
//       element('table', attr('style', 'table-layout: fixed'), blocks('{#each tokens as token}'),
//         element('tr',
//           element('td', attr('style', 'padding: 0 30px'), blocks('{token.id}')),
//           element('td', blocks('{token.value}'))), blocks('{/each}')),
//       element('table', attr('style', 'table-layout: fixed'), blocks('{#each paths as path}'),
//         element('tr',
//           element('td', attr('style', 'padding: 0 30px'), blocks('{path.type}')),
//           element('td', blocks('{JSON.stringify(path)}'))), blocks('{/each}')))))


onMount(() => {

  // language=svelte
  const template = `

  <main id="template">

<h1>Hello, {name}</h1>

  <div style="display: flex">
    <textarea test2={  {a:100, b:500}   } test="12312321" cols="80" rows="45" bind:value={text} on:input={parse}/>

    <table style="table-layout: fixed">
      {#each tokens as token}
        <tr>
          <td style="padding: 0 30px">{token.id}</td>
          <td>{token.value}</td>
        </tr>
      {/each}
    </table>

    <table style="table-layout: fixed">
      {#each paths as path}
        <tr>
          <td style="padding: 0 30px">{path.type}</td>
          <td>{JSON.stringify(path)}</td>
        </tr>
      {/each}
    </table>


  </div>
</main>
  `

  text = template
  parse()
})
</script>


<main id="template">
  <div style="display: flex">
    <textarea test2={  {a:100, b:500}   } test="12312321" cols="80" rows="45" bind:value={text} on:input={parse}/>

    <table style="table-layout: fixed">
      {#each tokens as token}
        <tr>
          <td style="padding: 0 30px">{token.id}</td>
          <td>{token.value}</td>
        </tr>
      {/each}
    </table>

    <table style="table-layout: fixed">
      {#each paths as path}
        <tr>
          <td style="padding: 0 30px">{path.type}</td>
          <td>{JSON.stringify(path)}</td>
        </tr>
      {/each}
    </table>


  </div>
</main>


<style>
:global(html) {
  font-size: 13px;
  font-family: monospace;
}

</style>