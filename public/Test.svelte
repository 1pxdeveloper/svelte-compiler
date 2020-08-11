<script>
let count = 0
let double

$: double = count * 2
$: if (count >= 10) {
  alert(`count is dangerously high!`)
  count = 9
}

function handleClick() {
  count += 1
}
</script>

<button on:click={handleClick}>
  Clicked {count} {double} {count === 1 ? 'time' : 'times'}
</button>