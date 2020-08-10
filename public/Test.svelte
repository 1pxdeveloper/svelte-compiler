<script>
let user = {loggedIn: false}
let t = {}

function toggle() {
  user.loggedIn = !user.loggedIn
}

function test() {

  user = {abc: false}



  user.abc.t = 12312312

  t[user.abc] = 'asdfasfd'
}


  user.abc = 1231231


</script>

{#if user.loggedIn}
  <button on:click={toggle}>
    Log out
  </button>
{/if}

{#if !user.loggedIn}
  <button on:click={toggle}>
    Log in
  </button>
{/if}