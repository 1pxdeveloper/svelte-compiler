<script>
let name = 100
let x = 0
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


<div>x: {x}</div>

{#if x % 2}
  <h1>sdklfjasklfdjasdf</h1>
{:else if x > 3}
  <h2>else if!!</h2>
{:else}
  <h2>else!!</h2>
{/if}

  <!--<h1>x:{x} y:{y} name: {name}</h1>-->
<!--<h2 class:test={test}>class test</h2>-->

<!--{#if x % 3}-->
<!--  text-->
<!--  <p>x:{x} x는 짝수입니다.</p>-->
<!--  <p>y:{y} x는 짝수입니다.</p>-->
<!--  <p>x:{x} x는 짝수입니다.</p>-->
<!--&lt;!&ndash;{:else if y % 2}&ndash;&gt;-->
<!--&lt;!&ndash;  <h1>This Else If!!</h1>&ndash;&gt;-->
<!--{:else}-->
<!--  <h1>This Else!!</h1>-->
<!--{/if}-->

<!--<div x={x} y="{y}" class:red={x > 0}>-->
<!--  <a href="http://1px.kr/{name+1}/{x+y}">hello, {name} {x+y}!</a>-->
<!--</div>-->

<!--<button on:click={reset}>reset</button>-->