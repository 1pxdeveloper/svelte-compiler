function createInstance(invalidate) {
  let cats = [{id: 'J---aiyznGQ', name: 'Keyboard Cat'}, {id: 'z_AbfPXTKms', name: 'Maru'}, {id: 'OUtn3pvWmpg', name: 'Henri The Existential Cat'}]
  return [
    () => cats,
    ({id, name}, i) => [
      () => i + 1,
      () => name]]
}

render(createInstance,
  element('h1', text('The Famous Cats of YouTube')),
  element('ul', text('\n	'),
    each(1, watch(0, 0), '{ id, name }, i', fragment(text('\n		'),
      element('li',
        element('a', text(' '), attr('target', '`_blank`'), text(' '), attr('href', '`https://www.youtube.com/watch?v=${id}`'), text('\n			'), watch(0, 0)(text()), text(': '), watch(1, 0)(text()), text('\n		'))), text('\n	'))), text('\n')))(document.body)