module()(() => {
  function createInstance($$invalidate, $$props, $$update) {
    let name = 0


    setInterval(() => {

      $$invalidate(name++, 1)
    }, 1000)
    return [[[() => name, 1], value => $$invalidate(name = value, 1)], {}]
  }

  return createComponent(createInstance,
    element('h1', text('Hello '), watch(0)($text), text('!')),
    element('input', attr('type', 'text'), watch(0)(setter(1)($bind('value')))))(...arguments)
})