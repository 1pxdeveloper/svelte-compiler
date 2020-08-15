<script>
export let bar = 0

function foo(node, bar) {
  // the node has been mounted in the DOM

  node.innerHTML = "start!" + bar


  return {
    update(bar) {
      // the value of `bar` has changed

      node.innerHTML = bar
    },

    destroy() {
      // the node has been removed from the DOM
    }
  }
}

setInterval(() => {
  bar++
}, 1000)
</script>

<div use:foo={bar}></div>