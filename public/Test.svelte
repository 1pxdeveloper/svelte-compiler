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

{#if x % 3}
  text
  <p>x:{x} x는 짝수입니다.</p>
  <p>y:{y} x는 짝수입니다.</p>
  <p>x:{x} x는 짝수입니다.</p>
{:else if y % 2}
  <h1>This Else If!!</h1>
{:else}
  <h1>This Else!!</h1>
{/if}

<div x={x} y="{y}" class:red={x > 0}>
  <a href="http://1px.kr/{name+1}/{x+y}">hello, {name} {x+y}!</a>
</div>

<button on:click={reset}>reset</button>