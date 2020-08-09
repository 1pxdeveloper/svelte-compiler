<script>
export let x = 100
export let z
export const k = 200

let y = 200

z = x + 300

let arr = [1, 2, 3, 4, 5]

function test() {
  let x = "test"
  let korea = "is good!"

  z = 100
  y = 500 + x
  z = x = z++
}

function abc() {
  x++
}
</script>


<h1 id="test-{x}">x:{x} {y} {x + y}</h1>

<input bind:value={x}>

<ul>
  {#each arr as row, index}
    <li>{row} {index} {x + index}</li>
  {/each}
</ul>


<input bind:value={y}>