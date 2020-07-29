<script>
let name = 100
let x = 5
let y = 7
let test = false


setInterval(() => {

  name++
  x++
  y--

}, 1000)


const reset = () => {
  name = 0
  x = 0
  y = 0
  test = !test
}
</script>


<h1>x:{x} y:{y} name: {name}</h1>
<h2 class:test={test}>class test</h2>

<div x={x} y="{y}" class:red={x > 0}>
  <a href="http://1px.kr/{name+1}/{x+y}">hello, {name} {x+y}!</a>
</div>


<button on:click={reset}>reset</button>