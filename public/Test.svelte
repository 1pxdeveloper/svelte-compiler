<script>
import Inner from "./Inner.svelte"

let a = 1
let b = 2

const onclick = () => {

  console.log(Inner)
}
</script>

<Inner>sdklfjklsf</Inner>

<label>
  <input type=number bind:value={a} min=0 max=10>
  <input type=range bind:value={a} min=0 max=10>
</label>

<label>
  <input type=number bind:value={b} min=0 max=10>
  <input type=range bind:value={b} min=0 max=10>
</label>

<p>{a} + {b} = {a + b}</p>


<button on:click={onclick}>skladjf</button>