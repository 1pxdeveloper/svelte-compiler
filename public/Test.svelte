<script>
let name = 100
let count = 0
let x = 0, y = 0
let z = 5


name = 0
name += 5

// [name] = [100, 200]


setInterval(() => {
  name++
  z += 5
}, 1000)

const inc = () => count++
const dec = () => count--
</script>

<div class={name}>
  <h1>hello, {name}!</h1>
  <h1>hello2, {name}?</h1>
  <h2>count: {count}</h2>
  <h3>sum: {x + y}</h3>

  <button on:click={(event) => inc(event)}>inc</button>
  <button on:click={(event) => dec(event)}>dec</button>
</div>