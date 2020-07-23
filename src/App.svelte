<script>
import {parseSvelte} from "./parser/svelte"
import {transformScript} from "./parser/script"
import {transformReactive} from "./parser/reactive"
import {getIndentifiers, initIndentifiers, setIndentifiers} from "./parser/identifiers"

let code = ""

let text = ""
let tokens = []
let paths = []

function transform(paths) {

  initIndentifiers()

  let header = ""
  let scriptContent
  let identifiers = Object.create(null)
  let index = 0
  let reactives = []

  let currentBindType = "text"

  let codes = paths.map(path => {
    switch (path.type) {
      case "script": {
        scriptContent = path.text
        return ""
      }

      case "elementOpen": {
        return `,\nelement('${path.tagName}'`
      }

      case "elementClose": {
        return `)`
      }

      case "attr": {
        const nodeValue = path.nodeValue || ""
        const source = nodeValue.charAt(0) === "{" ? nodeValue.slice(1, -1) : nodeValue
        const {code, identifiers_mask} = transformReactive(source)
        reactives[index] = code
        return `, bind(attr('${path.nodeName}'), ${index++}, ${identifiers_mask})`
      }

      case "text": {
        return `, text('${path.nodeValue}')`
      }

      case "identifier_block": {
        let identifier = path.code.slice(1, -1).trim()
        let code = setIndentifiers(identifier)
        reactives[index] = `()=>${identifier}`
        return `, bind(text(), ${index++}, ${code})`
      }

      case "blocks": {
        const {code, identifiers_mask} = transformReactive(path.code.slice(1, -1))
        reactives[index] = code
        return `, bind(text(), ${index++}, ${identifiers_mask})`
      }
    }
  }).join("")


  console.table(identifiers)
  console.table(reactives)

  header += transformScript(scriptContent, reactives).code

  codes = `${header}\n\nconst r = render(createInstance${codes})`
  return codes
}


function parse() {
  [tokens, paths] = parseSvelte(text)
  // console.table(tokens)
  code = transform(paths)
}

fetch("/Test.svelte").then(res => res.text()).then(code => {
  text = code
  parse()
})


</script>


<main id="template">
  <div>
    <textarea cols="80" rows="20" bind:value={text} on:input={parse}/>
  </div>

  <table style="table-layout: fixed">
    {#each paths as path}
      <tr>
        <td style="padding: 0 30px">{path.type}</td>
        <td>{JSON.stringify(path)}</td>
      </tr>
    {/each}
  </table>

  <br>
  <br>

  <div style="white-space: pre">{code}</div>

  <br>
  <br>
  <br>
  <br>
</main>


<style>
:global(body) {
  font-size: 14px;
  line-height: 1.2;
  font-family: "JetBrains Mono", monospace;
  padding: 20px;
  box-sizing: border-box;
}
</style>