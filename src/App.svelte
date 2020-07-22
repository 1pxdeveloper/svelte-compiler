<script>
import {parseSvelte} from "./parser/svelte"
import {transformScript} from "./parser/script"
import {transformReactive} from "./parser/reactive"

let code = ""

let text = ""
let tokens = []
let paths = []

function transform(paths) {

  let header = ""

  let codes = paths.map(path => {
    switch (path.type) {
      case "script": {
        header += transformScript(path.text).code
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
        const code = transformReactive(source).code.slice(0, -1)

        console.warn(source, code)

        return `, attr('${path.nodeName}', ${code})`
      }

      case "text": {
        return `, text('${path.nodeValue}')`
      }

      case "identifier_block": {
        const code = path.code.slice(1, -1).trim()
        return `, identifier('${code}')`
      }

      case "blocks": {
        const code = transformReactive(path.code.slice(1, -1)).code.slice(0, -1)
        return `, blocks(${code})`
      }
    }
  }).join("")


  codes = `${header}\n\nconst r = render(createInstance${codes})`
  return codes
}


function parse() {
  [tokens, paths] = parseSvelte(text)

  console.table(tokens)
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