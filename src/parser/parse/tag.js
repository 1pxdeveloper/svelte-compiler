const createEscapeOneLineRegexp = (open, close = open, ...blocks) => new RegExp(`${open}(?:${blocks.map(b => b + '|').join('')}\\\\.|[^\\\\${close}\n])*${close}`)
const string1 = createEscapeOneLineRegexp('"')
const string2 = createEscapeOneLineRegexp("'")
// const string3 = createEscapeOneLineRegexp("`")

const regexp_bracket = createEscapeOneLineRegexp("\\[", "\\]")
const regexp = createEscapeOneLineRegexp("\\/", "\\/", regexp_bracket.source)

const open_script = /<script(?=[\s>])/
const close_script = /<\/script\s*>/
const open_tag = /<[^\s/>]+/
const close_tag = /<\/[^\s>]+\s*>/
const content = /[^\s"'<>={}:]+/
const operator = /\/>|[&="'{}>:]/

const identifier_block = /\{\s*[$_\p{ID_Start}](?:[$_\u200C\u200D\p{ID_Continue}])*\s*\}/u

const lex = [
  ["(open_script)", open_script],
  ["(close_script)", close_script],
  ["(open_tag)", open_tag],
  ["(close_tag)", close_tag],
  ["(string)", string1],
  ["(string)", string2],
  // ["(template)", string3],
  ["(identifier_block)", identifier_block],
  ["(text)", content],
  ["(operator)", operator],
  ["(ws)", /\s+/],
  ["(unknown)", /./],
]

const re = new RegExp(lex.map(([type, regexp]) => "(" + regexp.source + ")").join("|"), "gu")

const createToken = (id, value, pos) => ({id, value, pos})

function tokenize(re, text) {
  let res = []

  text.replace(re, (value, ...args) => {
    args.pop()
    const pos = args.pop()
    const index = args.indexOf(value)
    const type = lex[index][0]

    switch (type) {
      case "(open_tag)":
        res.push(createToken(type, value.slice(1), pos))
        return value

      case "(close_tag)":
        res.push(createToken(type, value.slice(2, -1).trim(), pos))
        return value

      case "(operator)":
        res.push(createToken(value, value, pos))
        return value
    }

    res.push(createToken(type, value, pos))
    return value
  })

  return res
}


let tokens = []
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
  while (token && !ids.includes(token.id)) {
    res += next().value
  }
  return res
}

function skip(id) {
  if (token && token.id === id) {
    next()
  }
}

function ws() {
  skip("(ws)")
}


///
let paths = []

function createPath(type) {
  const path = {type}
  paths.push(path)
  return path
}

function svelte() {
  next()
  for (let i = 0; i < 200; i++) {
    ws()
    if (!token) break
    script() || element() || identifier_blocks() || blocks() || textNode()
  }
  ws()
}


function script() {
  if (token.id !== "(open_script)") return false

  next()
  const path = createPath("script")
  attrs()
  next(">")

  path.textContent = nextUntil("(close_script)")
  next()
  return true
}

function element() {
  if (token.id === "(open_tag)") return elementOpen()
  if (token.id === "(close_tag)") return elementClose()
  return false
}


function elementOpen() {
  const path = createPath("elementOpen")

  ws()
  path.tagName = next().value
  ws()

  attrs()
  ws()

  if (token.id === "/>") {
    const path2 = createPath("elementClose")
    path2.tagName = path.tagName
    next()
    return true
  }

  if (token.id === ">") next()
  return true
}


function attrs() {
  while (token && (token.id === "(text)" || token.id === "(identifier_block)")) {
    attr()
    ws()
  }
}

function attr() {
  const path = createPath("attr")

  if (token.id === "(identifier_block)") {
    const value = token.value.slice(1, -1).trim()
    path.nodeName = value
    path.nodeValue = value
    next()
    return
  }

  path.nodeName = next("(text)").value || ""
  ws()

  if (token.id === "=") {
    next()
    ws()

    if (token.id === "(string)") path.nodeValue = transformTemplate(next().value) || ''
    else if (token.id === "(identifier_block)") path.nodeValue = next().value || ''
    else if (token.id === "{") path.nodeValue = brace() || ''
    else throw new SyntaxError("invalid token!" + token.value)
  }
}


function elementClose() {
  const path = createPath("elementClose")
  ws()
  path.tagName = next().value
  return true
}


function identifier_blocks() {
  if (token.id !== "(identifier_block)") return false
  const path = createPath("identifier_block")
  path.code = next().value
  return true
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
  path.nodeValue = nextUntil("(open_tag)", "(close_tag)", "(identifier_block)", "{", "(open_script)")
  return true
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

export function parseSvelte(text) {
  tokens = tokenize(re, text)
  index = 0
  paths = []

  try {
    svelte()
  } catch (e) { console.error(e) }

  return [tokens, paths.slice()]
}


export function transformTemplate(string) {
  const rollback = [tokens, index, paths, token]
  tokens = tokenize(re, string.slice(1, -1))
  index = 0
  paths = []
  next()


  console.table(tokens)


  let code = '`'

  while (token) {
    code += nextUntil("(identifier_block)", "{")
    if (token.id === "{") code += '$' + brace()
    else if (token.id === "(identifier_block)") code += '222$' + next().value
  }

  code += '`'

  tokens = rollback[0]
  index = rollback[1]
  paths = rollback[2]
  token = rollback[3]
  return code
}