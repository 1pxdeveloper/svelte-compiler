<script>
let name = 'world'
let arr = name.split('').map(m => ({name: m}))

const shuffle = () => {
  arr = arr.slice().sort(() => Math.random() - Math.random())
}

const push = () => {
  arr = [...arr, {name: "???"}]
}

const shift = () => {
  arr = arr.slice(2)
}

</script>

<h1>Hello {name}! {arr.map(n => n.name).join(' ')}</h1>
<input type="text" bind:value={name}/>

<div>
  <button on:click={shuffle}>shuffle</button>
</div>

<div>
  <button on:click={push}>push</button>
</div>

<div>
  <button on:click={shift}>shift</button>
</div>


{#each arr as row, index}
  <p>{index} {row.name}</p>
  <input bind:value={row.name}/>
{/each}