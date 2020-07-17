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
    throw new Error("Unexpected token: " + token.id)
  }

  const t = token
  token = tokens[index++] || null
  return t
}

function nextUntil(...ids) {
  let res = "";
  while(!ids.includes(token.id)) {
    res += next().value;
  }
  return res;
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
  for (let i = 0; i < 100; i++) {
    if (!token) break
    script() || element()
    skip("(ws)")
  }
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
  throw new Error("invalid Element.")
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
    path.type = "elementVoid"
    next()
  }

  if (token.id === ">") next()
}

function elementClose() {
  const path = createPath("elementClose")
  skip("(ws)")
  path.tagName = next().value
}


function attr() {
  const path = createPath("attr")
  path.nodeName = next("(text)").value

  if (token.id === "(ws)") {}
  if (token.id === "=") next()

  if (token.id === "(string)") path.nodeValue = next().value
}

function brace() {
  const path = createPath("brace")
  path.nodeName = next("(text)").value

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
  console.log(paths)
}

onMount(() => {
  const template = document.getElementById("template")
  text = template.innerHTML
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