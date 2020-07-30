let count = 0
let source = ""

let tokens = []
let paths = []
let path

const createRepeat = (...args) => (...until) => () => {
  if (!source) return

  if (count++ > 1000) {
    throw new Error("max circular")
  }

  const concated = args.concat(until)
  const re = new RegExp("^(?:" + concated.map(arg => arg[1].source).join("|") + ")", "u")

  while (source) {
    const m = re.exec(source)
    if (!m) {throw new Error("invalid. " + source + " " + re)}
    source = RegExp.rightContext

    const index = m.slice(1).findIndex(arg => arg !== undefined)
    const target = concated[index]

    const [type, reg, next, isSkip] = target
    !isSkip && dispatch(type, m[0])

    next && next()()
    if (index >= args.length) break
    if (until.length === 0) break
  }
}


/// common
const ws = ["(ws)", /(\s+)/]


/// root
const commentsStart = ["(commentsStart)", /([<]!--)/u, () => comments]
const commentsText = ["(commentsText)", /()/u, () => comments]
const commentsEnd = ["(commentsEnd)", /(-->)/u, () => comments]

const rawTextStartTags = ["(rawTextStartTags)", /<(script|style)(?=\s|>)/u, () => rawTextElement]
const rawTextEndTags = ["(rawTextEndTags)", /<\/(script|style)(?=\s|>)[^>]*>/u]

const startTagsOpen = ["(startTagsOpen)", /<([^\s\/>]+)/u, () => attrs]
const endTags = ["(endTags)", /<\/([^>\s]+)[^>]*>/u]
const texts = ["(texts)", /([^<{]+)/u]


/// attr
const attrName = ["(attrName)", /([^\s"'<>=/{]+)/u, () => attr]
const attrEmpty = ["(attrEmpty)", /((?=[\s/>]))/u]
const attrOperator = ["=", /(\s*=\s*)/u, () => attrValue]


const startTagsSelfClose = ["(startTagsSelfClose)", /(\/>)/u]
const startTagsClose = ["(startTagsClose)", /(>)/u]


/// attrValue
const unquoted = ["(unquoted)", /([^\s?"'=<>`{]+)/u]

const singleQuotedStart = ["(singleQuotedStart)", /(')/u, () => singleQuotedAttrValue]
const singleQuotedCharacters = ["(singleQuotedCharacters)", /([^'{]+)/u]
const singleQuotedEnd = ["(singleQuotedEnd)", /(')/u]

const doubleQuotedStart = ["(doubleQuotedStart)", /(")/u, () => doubleQuotedAttrValue]
const doubleQuotedCharacters = ["(doubleQuotedCharacters)", /([^"{]+)/u]
const doubleQuotedEnd = ["(doubleQuotedEnd)", /(")/u]


/// blocks
const blockOpenStart = ["(blockOpenStart)", /(\{\s*(?:(?::else\s+if\s+)|(?:[#@:][^\s}]+)))/u, () => blocks]
const blockCloseStart = ["(blockCloseStart)", /(\{\s*[/][^\s}]+)/u, () => blocks]
const blockCharacters = ["(blockCharacters)", /([^"'`{}]+)/u]
const blockEnd = ["(blockEnd)", /(\})/u]


/// interpolation
const interpolationStart = ["(interpolationStart)", /(\{)/u, () => interpolation]
const interpolationCharacters = ["(interpolationCharacters)", /([^"'`{}]+)/u]
const interpolationEnd = ["(interpolationEnd)", /(\})/u]


/// js
const createEscapeOneLineRegexp = (open, close = open, ...blocks) => new RegExp(`${open}(?:${blocks.map(b => b + '|').join('')}\\\\.|[^\\\\${close}])*${close}`)
const re_js_string1 = createEscapeOneLineRegexp("'")
const re_js_string2 = createEscapeOneLineRegexp('"')
const re_js_string3 = createEscapeOneLineRegexp("`")

const js_string1 = ["(interpolationCharacters)", new RegExp('(' + re_js_string1.source + ')', 'u')]
const js_string2 = ["(interpolationCharacters)", new RegExp('(' + re_js_string2.source + ')', 'u')]
const js_string3 = ["(interpolationCharacters)", new RegExp('(' + re_js_string3.source + ')', 'u')]


const parse = () => {
  while (source) root()
}

const comments = () => {
  const lastIndex = source.indexOf("-->")

  dispatch("(textContent)", source.slice(0, lastIndex))
  source = source.slice(lastIndex)

  dispatch("(commentEnd)", "-->")
  source = source.slice(3)
}

const rawTextElement = () => {
  const startTag = RegExp.lastMatch
  const endTag = "</" + startTag.slice(1)

  attrs()

  const lastIndex = source.indexOf(endTag)
  dispatch("(textContent)", source.slice(0, lastIndex))
  source = source.slice(lastIndex)
}

const root = createRepeat(commentsStart, rawTextStartTags, rawTextEndTags, startTagsOpen, endTags, ws, texts, blockOpenStart, blockCloseStart, interpolationStart)()
const attrs = createRepeat(ws, attrName, interpolationStart)(startTagsSelfClose, startTagsClose)
const attr = createRepeat(attrOperator, attrEmpty)()
const attrValue = createRepeat(unquoted, singleQuotedStart, doubleQuotedStart, interpolationStart)()
const singleQuotedAttrValue = createRepeat(interpolationStart, singleQuotedCharacters)(singleQuotedEnd)
const doubleQuotedAttrValue = createRepeat(interpolationStart, doubleQuotedCharacters)(doubleQuotedEnd)
const interpolation = createRepeat(interpolationCharacters, js_string1, js_string2, js_string3)(interpolationEnd)
const blocks = createRepeat(blockCharacters, js_string1, js_string2, js_string3)(blockEnd)


/// Path
const createPath = (type) => {
  path = Object.create(null)
  path.type = type
  paths.push(path)
}

const dispatch = (type, value) => {

  tokens.push({type, value})

  switch (type) {
    case "(rawTextStartTags)":
      createPath("rawTextElement")
      path.tagName = value.slice(1)
      break

    case "(commentsStart)":
      createPath("comment")
      break

    case "(textContent)":
      path.textContent = value
      break

    case "(startTagsOpen)":
      createPath("elementOpen")
      path.tagName = value.slice(1)
      break

    case "(attrName)":
      createPath("attr")
      path.name = value
      path.value = ""
      break

    case "(unquoted)":
      path.value = value
      break

    case "(singleQuotedStart)":
    case "(doubleQuotedStart)":
      path.value += '`'
      path.isTemplate = true
      break

    case "(singleQuotedCharacters)":
    case "(doubleQuotedCharacters)":
      path.value += value
      break

    case "(singleQuotedEnd)":
    case "(doubleQuotedEnd)":
      path.value += '`'
      delete path.isTemplate
      break

    case "(blockOpenStart)":
      createPath("blockOpenStart")
      path.tagName = value.slice(1).trim()
      path.value = ""
      path.isWatch = true
      break

    case "(blockCharacters)":
      path.value += value
      break

    case "(blockCloseStart)":
      createPath("blockCloseStart")
      path.tagName = value.slice(1).trim()
      break

    case "(interpolationStart)":
      if (path.type !== "attr") {
        createPath("text")
        path.value = "{"
        path.isWatch = true
        break
      }
      if (path.isTemplate) {
        path.value += '${'
        break
      }
      path.value += '{'
      path.isWatch = true
      break

    case "(interpolationCharacters)":
      path.value += value
      break

    case "(interpolationEnd)":
      path.value += '}'
      break

    case "(startTagsSelfClose)":
      createPath("elementClose")
      break

    case "(endTags)":
      createPath("elementClose")
      path.tagName = value.slice(2, -1).trim()
      break

    case "(ws)":
      createPath("ws")
      path.textContent = value
      break

    case "(texts)":
      createPath("text")
      path.textContent = value
      break
  }
}


export const parseSvelte = (text) => {
  source = text
  paths = []
  tokens = []
  parse()

  return [tokens, paths]
}