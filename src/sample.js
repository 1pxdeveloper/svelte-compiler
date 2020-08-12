module()(() => {
  function createInstance($$invalidate, $$props, $$update) {
    let name = 'world'
    let arr = name.split('').map(m => ({name: m}))
    return [

      [[() => name, 1], [() => `text`, 0], value => $$invalidate(name = value, 1), [() => arr, 2],



        [(row, index) => [[() => index, 0], [() => row.name, 0], [() => `text`, 0], value => row.name = value]], 10]




      , {}]
  }

  return createComponent(createInstance,
    element('h1', text('Hello '), watch(0)($text), text('!')),
    element('input', watch(1)($attr('type')), watch(0)(setter(2)($bind('value')))),
    each(4, watch(3), fragment(
      element('h2', watch(0)($text), text(' '), watch(1)($text)),
      element('input', watch(2)($attr('type')), watch(1)(setter(3)($bind('value')))))))(...arguments)
})