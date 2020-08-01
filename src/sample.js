function createInstance(invalidate) {
  let cats = [{id: 'J---aiyznGQ', name: 'Keyboard Cat'}, {id: 'z_AbfPXTKms', name: 'Maru'}, {id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat'}]

  let x = 0

  x = 10

  return [
    () => x,
    () => cats,

    ({id, name}, i) => [
      () => i + 1,
      () => name
    ]
  ]
}

render(createInstance,
  element('h1', text('The Famous Cats of YouTube')),
  element('div', text('x: '), watch(0, 0)(text())),
  element('div', watch(1, 0)(text())),
  element('ul', text('\n	'),
    each(watch(1, 0), '{ id, name }, i', fragment(text('\n		'),
      element('li',
        element('a', text(' '), attr('target', '`_blank`'), text(' '), attr('href', '`https://www.youtube.com/watch?v=${id}`'), text('\n			'), watch(2, 0)(text()), text(': '), watch(3, 0)(text()), text('\n		'))), text('\n	'))), text('\n')))(document.body)