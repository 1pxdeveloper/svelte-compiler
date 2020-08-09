createComponent(createInstance,
  element('h1', watch(0, 2)($attr('id')), text('x:'), watch(1, 2)($text), text(' '), watch(2, 4)($text), text(' '), watch(3, 6)($text)),
  element('input', watch(1, 2)(setter(4)($bind('value')))),
  element('ul', text('\n  '),
    each(6, watch(5, 0), fragment(text('\n    '),
      element('li', watch(0, 0)($text), text(' '), watch(1, 0)($text), text(' '), watch(2, 2)($text)), text('\n  '))), text('\n')),
  element('input', watch(2, 4)(setter(7)($bind('value')))))(arguments[0])


