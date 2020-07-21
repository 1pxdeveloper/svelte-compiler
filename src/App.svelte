<script>
import {parseSvelte} from "./parser/svelte"
import {transformScript} from "./parser/script"
import {transformReactive} from "./parser/reactive"


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
        const code = transformReactive(path.nodeValue.slice(1, -1)).code.slice(0, -1)
        return `, attr('${path.nodeName}', ${code})`
      }

      case "text": {
        return `, text('${path.nodeValue}')`
      }

      case "identifier_block": {
        const code = transformReactive(path.code.slice(1, -1)).code.slice(0, -1)
        return `, identifier(${code})`
      }

      case "blocks": {
        const code = transformReactive(path.code.slice(1, -1)).code.slice(0, -1)
        return `, blocks(${code})`
      }
    }
  }).join("")


  codes = `${header}\n\nrender(createInstance${codes}))`


  console.log(codes)

  return codes
}


function parse() {
  [tokens, paths] = parseSvelte(text)
  transform(paths)
}

fetch("/Test.svelte").then(res => res.text()).then(code => {
  text = code
  parse()
})


function createInstance(invalidate) {
  let src = 'tutorial/image.gif'
  let name = 'Rick Astley'
  invalidate('src', src)
  invalidate('name', name)
}


</script>


<main id="template">
  <div style="display: flex">
    <textarea cols="80" rows="45" bind:value={text} on:input={parse}/>

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