<script>
import {transform} from "./parser"
import {parseSvelte} from "./parser/svelte"

let code = ""

let text = ""
let tokens = []
let paths = []

let timer

function input() {
  clearTimeout(timer)
  timer = setTimeout(parse, 500)
}

function parse() {
  [tokens, paths] = parseSvelte(text)

  console.table(tokens)
  console.table(paths)

  code = transform(paths)
  iframe && iframe.contentWindow.location.reload()
}

fetch("/Test.svelte").then(res => res.text()).then(code => {
  text = code
  parse()
})


let iframe

const apply = () => {
  setTimeout(() => {
    iframe.contentWindow.eval(code)
  }, 250)
}

</script>


<div class="hbox">
  <textarea class="flex" cols="80" rows="40" bind:value={text} on:input={input}/>
  <textarea class="flex" cols="80" rows="40" bind:value={code}></textarea>
</div>


<iframe src="/run.html" bind:this={iframe} frameborder="0" width="100%" height="300px" on:load={apply}></iframe>


<!--  <table style="table-layout: fixed">-->
<!--    {#each paths as path}-->
<!--      <tr>-->
<!--        <td style="padding: 0 30px">{path.type}</td>-->
<!--        <td>{JSON.stringify(path)}</td>-->
<!--      </tr>-->
<!--    {/each}-->
<!--  </table>-->

<!--  <br>-->
<!--  <br>-->


<style globals>
html, body {
  height: 100%;
}

body {
  font-size: 14px;
  line-height: 1.2;
  font-family: "monaco", "JetBrains Mono", monospace;
  padding: 20px;
  box-sizing: border-box;
}

* {
  padding: 8px;
}

.hbox {
  display: flex;
}

.flex {
  flex: 1;
}
</style>