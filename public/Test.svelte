<script>
let x = 3


// setInterval(() => {
//   x++
// }, 1000)

</script>

<h1>{x} {100}</h1>


<label>
  <input type="checkbox" bind:checked={x}/> visible
</label>

<h1>x: {x}</h1>

{#if x % 2}
  <p transition:fade={1000} test="100">ddd {x} is greater than 10 ANimation!!!!!!!!!</p>
{/if}

<div>asdlkfjaskldfjklas dfkl sakflj klsd </div>