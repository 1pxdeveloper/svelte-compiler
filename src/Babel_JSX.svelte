<script>
const createEscapeOneLineRegexp = (open, close = open, ...blocks) => new RegExp(`${open}(?:${blocks.map(b => b + '|').join('')}\\\\.|[^\\\\${close}\n])*${close}`)
const string1 = createEscapeOneLineRegexp('"')
const string2 = createEscapeOneLineRegexp("'")
const string3 = createEscapeOneLineRegexp("`")

const regexp_bracket = createEscapeOneLineRegexp("\\[", "\\]")
const regexp = createEscapeOneLineRegexp("\\/", "\\/", regexp_bracket.source)

const operator = /[{}]]/

const lex = [
  ["(string)", string1],
  ["(string)", string2],
  // ["(template)", string3],
  ["(operator)", operator],
  ["(ws)", /\s+/],
  ["(unknown)", /./],
]

const re = new RegExp(lex.map(([type, regexp]) => "(" + regexp.source + ")").join("|"), "gu")

const script = `{ x + y } skdfjlskdf asdf`



let a = re.exec(script)


console.log(a)
</script>