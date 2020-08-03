let count = 0
let source = ""

let tokens = []
let paths = []
let path


const createRepeat = (phase, ...args) => (...until) => () => {
  if (!source) return

  if (count++ > 1000) {
    throw new Error("max circular")
  }

  const concated = until.concat(args)
  const re = new RegExp("^(?:" + concated.map(arg => arg[1].source).join("|") + ")", "u")

  while (source) {
    const m = re.exec(source)
    if (!m) {
      console.table(tokens)
      console.table(paths)
      throw new Error("invalid. \n\n" + source + '\n\n' + args)
    }
    source = RegExp.rightContext

    const index = m.slice(1).findIndex(arg => arg !== undefined)
    const target = concated[index]

    const [type, reg, next, isSkip] = target
    !isSkip && dispatch(phase, type, m[0])

    next && next()()
    if (index < until.length) break
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

/// start Tag Close
const startTagsOpen = ["(startTagsOpen)", /<([^\s\/>]+)/u, () => attrs]
const endTags = ["(endTags)", /<\/([^>\s]+)[^>]*>/u]
const texts = ["(texts)", /([^<{]+)/u]


/// start Tag Close
const startTagsSelfClose = ["(startTagsSelfClose)", /(\/>)/u]
const startTagsClose = ["(startTagsClose)", /(>)/u]


/// attr
const attrName = ["(attrName)", /([^\s"'<>=/{}]+)/u, () => attr]
const attrEmpty = ["(attrEmpty)", /((?=[\s/>]))/u]
const attrOperator = ["=", /(\s*=\s*)/u, () => attrValue]
const attrShorthandStart = ["(attrShorthandStart)", /(\{)/u, () => attrShorthand]
const attrShorthandCharacter = ["(attrShorthandCharacter)", /([^\s"'<>=/{}]+)/u]
const attrShorthandEnd = ["(attrShorthandEnd)", /(\})/u]

/// attrValue
const unquoted = ["(unquoted)", /([^\s?"'=<>`{]+)/u]

const singleQuotedStart = ["(singleQuotedStart)", /(')/u, () => singleQuotedAttrValue]
const singleQuotedCharacters = ["(singleQuotedCharacters)", /([^'{]+)/u]
const singleQuotedEnd = ["(singleQuotedEnd)", /(')/u]

const doubleQuotedStart = ["(doubleQuotedStart)", /(")/u, () => doubleQuotedAttrValue]
const doubleQuotedCharacters = ["(doubleQuotedCharacters)", /([^"{]+)/u]
const doubleQuotedEnd = ["(doubleQuotedEnd)", /(")/u]


/// blocks
const logicBlockOpenStart = ["(logicBlockOpenStart)", /(\{\s*(?:(?::else\s+if\s+)|(?:[#@:][^\s}]+)))/u, () => blocks]
const logicBlockCloseStart = ["(logicBlockCloseStart)", /(\{\s*[/][^\s}]+)/u, () => blocks]
const logicBlockCharacters = ["(logicBlockCharacters)", /([^"'`{}]+)/u]
const logicBlockEnd = ["(logicBlockEnd)", /(\})/u]


/// blocks
const eachBlockOpenStart = ["(eachBlockOpenStart)", /(\{\s*#each\s+)/u, () => eachBlocks]
const eachBlockCharacters = ["(eachBlockCharacters)", /([^\s"'`{}]+)/u]
const eachBlockCharactersWs = ["(eachBlockCharacters)", /(\s+)/u]
const eachAs = ["(eachBlockAs)", /(\s+as\s+)/u, () => eachRest]


/// block
const blockStart = ["(blockStart)", /(\{)/u, () => block]
const blockCharacters = ["(blockCharacters)", /([^"'`{}]+)/u]
const blockEnd = ["(blockEnd)", /(\})/u]


/// js
const createEscapeOneLineRegexp = (open, close = open, ...blocks) => new RegExp(`${open}(?:${blocks.map(b => b + '|').join('')}\\\\.|[^\\\\${close}])*${close}`)
const re_js_string1 = createEscapeOneLineRegexp("'")
const re_js_string2 = createEscapeOneLineRegexp('"')
const re_js_string3 = createEscapeOneLineRegexp("`")

const js_string1 = ["(blockCharacters)", new RegExp('(' + re_js_string1.source + ')', 'u')]
const js_string2 = ["(blockCharacters)", new RegExp('(' + re_js_string2.source + ')', 'u')]
const js_string3 = ["(blockCharacters)", new RegExp('(' + re_js_string3.source + ')', 'u')]


const parse = () => {
  while (source) root()
}

const comments = () => {
  const lastIndex = source.indexOf("-->")

  dispatch("comment", "(textContent)", source.slice(0, lastIndex))
  source = source.slice(lastIndex)

  dispatch("comment", "(commentEnd)", "-->")
  source = source.slice(3)
}

const rawTextElement = () => {
  const startTag = RegExp.lastMatch
  const endTag = "</" + startTag.slice(1)

  attrs()

  const lastIndex = source.indexOf(endTag)
  dispatch("rawTextElement", "(textContent)", source.slice(0, lastIndex))
  source = source.slice(lastIndex)
}

const root = createRepeat("root", commentsStart, rawTextStartTags, rawTextEndTags, startTagsOpen, endTags, ws, texts, eachBlockOpenStart, logicBlockOpenStart, logicBlockCloseStart, blockStart)()
const attrs = createRepeat("attrs", ws, attrShorthandStart, attrName)(startTagsSelfClose, startTagsClose)
const attr = createRepeat("attr", attrOperator, attrEmpty)()
const attrShorthand = createRepeat("attrShorthand", attrShorthandCharacter)(attrShorthandEnd)
const attrValue = createRepeat("attr", unquoted, singleQuotedStart, doubleQuotedStart, blockStart)()
const singleQuotedAttrValue = createRepeat("attr", blockStart, singleQuotedCharacters)(singleQuotedEnd)
const doubleQuotedAttrValue = createRepeat("attr", blockStart, doubleQuotedCharacters)(doubleQuotedEnd)
const block = createRepeat(null, blockCharacters, js_string1, js_string2, js_string3)(blockEnd)
const blocks = createRepeat(null, logicBlockCharacters, js_string1, js_string2, js_string3, blockStart)(logicBlockEnd)
const eachBlocks = createRepeat(null, eachBlockCharacters, eachBlockCharactersWs, js_string1, js_string2, js_string3, blockStart)(eachAs, logicBlockEnd)
const eachRest = createRepeat(null, eachBlockCharacters, eachBlockCharactersWs, js_string1, js_string2, js_string3, blockStart)(logicBlockEnd)


/// Path
const createPath = (type) => {
  path = Object.create(null)
  path.type = type
  paths.push(path)
}


const VOID_TAG_NAME = ['area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed', 'frame', 'hr', 'image', 'img', 'input', 'isindex', 'keygen', 'link', 'menuitem', 'meta', 'nextid', 'param', 'source', 'track', 'wbr']

let lastTagName

const dispatch = (phase, type, value) => {

  tokens.push({phase, type, value})

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
      lastTagName = path.tagName = value.slice(1)
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
      if (path.isTemplate) {
        path.isWatch = true
        path.value = '{' + path.value + '}'
      }
      delete path.isTemplate
      break

    case "(attrShorthandStart)":
      createPath("attr")
      path.name = ""
      break

    case "(attrShorthandCharacter)":
      path.name += value
      break

    case "(attrShorthandEnd)":
      path.value = '{' + path.name + '}'
      path.isWatch = true
      break


    case "(logicBlockOpenStart)":
      createPath("logicBlockOpenStart")
      path.tagName = value.slice(1).trim()
      path.value = ""
      path.isWatch = true
      break

    case "(logicBlockCharacters)":
      path.value += value
      break

    case "(logicBlockCloseStart)":
      createPath("logicBlockCloseStart")
      path.tagName = value.slice(1).trim()
      break

    case "(eachBlockOpenStart)":
      createPath("each")
      path.tagName = value.slice(1).trim()
      path.value = ""
      break

    case "(eachBlockAs)":
      path.name = path.value
      path.value = ""
      break

    case "(eachBlockCharacters)":
      path.value += value
      break


    case "(blockStart)":

      console.log(path)

      if (path.type === "elementOpen") {
        createPath("attr")
        break
      }

      if (path.isTemplate) {
        path.value += '${'
        break
      }

      if (path.type === "attr") {
        path.value += '{'
        path.isWatch = true
        break
      }

      if (path.type === "each") {
        path.value += '{'
        break
      }

      // text
      createPath("text")
      path.value = "{"
      path.isWatch = true
      break

    case "(blockCharacters)":
      path.value += value
      break

    case "(blockEnd)":
      path.value += '}'
      break

    case "(startTagsClose)":
      if (VOID_TAG_NAME.includes(lastTagName)) createPath("elementClose")
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