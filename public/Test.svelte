<script>

let x = 10
let y = 20
let z = "ABCD".split("")
let k = [1, 2, 3]

setInterval(() => x++, 1000)

function push() {
  console.log("@@@@@@@@@@@@@@@@@@@")
  z = [...z, Math.random().toString(36).slice(2)]
}

function remove(row) {
  const index = z.findIndex(i => i === row)
  z = [...z.slice(0, index), ...z.slice(index + 1)]
}
</script>


<div>x:{x} y:{y}</div>

<h2>{z.length}</h2>

<ul>
  {#each z as row, index}
    <li>{x} {row} - {index}
      <button on:click={() => remove(row)}>DEL</button>

      <h6>test</h6>
      <ul>
        {#each k as row2, index2}
          <div>{row} {index} {x} {row2} {index2}</div>
        {/each}
      </ul>
    </li>
  {/each}
</ul>


<button on:click={push}>PUSH</button>