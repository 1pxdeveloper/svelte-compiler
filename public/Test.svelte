<script>
let name = 'world'
let arr = name.split('').map(m => ({name: m}))

</script>

<h1>Hello {name}!</h1>
<input type="text" bind:value={name}/>

{#each arr as row, index}
  <h2>{index} {row.name}</h2>
  <input type="text" bind:value={row.name}/>
{/each}