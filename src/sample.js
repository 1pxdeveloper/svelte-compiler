module()(() => {
  function createInstance(invalidate, $$props) {
    let user = {loggedIn: false}

    function toggle() {
      user.loggedIn = !user.loggedIn
    }

    return [[[() => !!user.loggedIn, 0], [() => toggle, 0], [() => !!!user.loggedIn, 0]], {}]
  }

  return createComponent(createInstance,
    If(watch(0), fragment(
      element('button', watch(1)($on('click')), text('\n		'), text('Log out\n	')))),
    If(watch(2), fragment(
      element('button', watch(1)($on('click')), text('\n		'), text('Log in\n	')))))(...arguments)
})