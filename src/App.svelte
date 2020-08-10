<script>
import {transform} from "./parser"
import {parseSvelte} from "./parser"

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


const module = (...sources) => (fn) => {
  // Promise.all(sources.map(() => abc))
  return fn()
}


function apply() {
  // if (!iframe.contentWindow.module) iframe.contentWindow.module = module
  iframe.contentWindow.postMessage(code)
}

fetch("/Test.svelte").then(res => res.text()).then(code => {
  text = code
  parse()
})

let iframe
let x = {}
</script>


<div class="hbox">
  <textarea h=2 class="flex" cols="80" rows="30" bind:value={text} on:input={input}/>
  <textarea class="flex" cols="80" rows="30" bind:value={code}></textarea>
</div>

<iframe test="aksdfjsdf" {iframe} {...x} y={x + '2>0'} src="/run.html" bind:this={iframe} frameborder="0" width="100%" height="300px" on:load={apply}></iframe>


<style globals>
html, body {
  height: 100%;
}

body {
  font-size: 12px;
  line-height: 1.2;
  font-family: "JetBrains Mono", "monaco", monospace;
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

textarea {
  font-size: inherit;
  tab-size: 2;
}
</style>