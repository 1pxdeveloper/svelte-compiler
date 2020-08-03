function createInstance(invalidate) {
  let name = ''
  return [
    () => name,
    value => name = value,
    () => `enter your name`,
    () => name || 'stranger']
}

render(createInstance,
  element('input', text(' '), watch(0, 1)(setter(1, 3)($bind('value'))), text(' '), watch(2, 0)($attr('placeholder'))),
  element('p', text('Hello '), watch(3, 1)($text), text('!')))(document.body)