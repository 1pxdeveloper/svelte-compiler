<script>
	let string = `here's some <strong>HTML!!!</strong>`;
</script>

<input type="text" bind:value={string}/>

<p>{@html string}</p>