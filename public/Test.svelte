<script>
	let x = 3;


	setInterval(() => {
		x++
	}, 1000)

</script>

<h1>{x}</h1>


{#if x > 10}
	<p>{x} is greater than 10</p>
{:else if 5 > x}
	<p>{x} is less than 5</p>
{:else}
	<p>{x} is between 5 and 10</p>
{/if}


<div>asdlkfjaskldfjklas dfkl sakflj klsd </div>