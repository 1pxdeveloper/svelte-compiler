<script>
let name = 100
let count = 0;

name = 0
name += 5

// [name] = [100, 200]


setInterval(() => {
  name++
}, 1000)

const inc = () => count++
const inc2 = () => count += 5
</script>

<div class={name}>
  <h1>hello, {name}!</h1>
  <h2>count: {count}</h2>

  <button on:click={inc}>inc</button>
</div>