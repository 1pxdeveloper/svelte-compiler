<script>
import {transformScript} from "./parser/babel/scriptTag.js"


// language=js
const input = `
  import {foo} from "./test"

  let pos = {x:10, y:20, z: {foo: "bar"}}

  pos.x = 200;
  pos.z.foo++;


  function test() {
    pos.y = 400;
    pos.z.foo = "ASdfasdfsadf"
  }
`


let ddd = `

import element from "svelte/node/element"
import attr from "svelte/node/attr"
import bind from "svelte/node/bind"

export default class UIComponent extends SvelteComponent {
  constructor() {
    super(createInstance, element("div", attr("style", "display:flex"),
      element("textarea", attr("cols", "80"), attr("rows", "45"), bind("value", [(text) => text), 'text']),
      element("div", attr("style", "padding: 10px")),
      element("pre", attr("style", "tab-size: 4"), text(({result}) => result)))
  }
}`


console.time("1")

const output = transformScript(input)

console.log("output", output)
console.log(output.code + ddd)
console.timeEnd("1")
</script>