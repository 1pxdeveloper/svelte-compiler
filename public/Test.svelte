<script>
import Inner from "./Inner.svelte"

export let prop = 100
let x = 10
let y = 20
let arr = [1, 2, 3]

setInterval(() => {
  x++
}, 1000)


setInterval(() => {
  y++
}, 3000)

</script>


<Inner {x} {y}/>


<h1 id={x}>Hello, {x} {y} {x + y}</h1>

<ul>
  {#each arr as row, index}
    <li>{row} {index} {row + x}</li>
  {/each}
</ul>

