function createInstance(invalidate) {

  let x = 10
  let y = 20
  let z = "ABCD".split("")
  let k = [1, 2, 3]

  setInterval(() => invalidate(1, x++), 1000)

  function push() {
    console.log("@@@@@@@@@@@@@@@@@@@")
    invalidate(2, z = [...z, Math.random().toString(36).slice(2)])
  }

  function remove(row) {
    const index = z.findIndex(i => i === row)
    invalidate(2, z = [...z.slice(0, index), ...z.slice(index + 1)])
  }

  return [
    () => x,
    () => y,
    () => z.length,
    () => z,

    (row, index) => [
      () => x,
      () => row,
      () => index,
      () => () => remove(row),
      () => k,

      (row2, index2) => [
        () => row,
        () => index,
        () => x,
        () => row2,
        () => index2]],

    () => push]
}


render(createInstance,
  element('div', text('x:'), watch(0, 1)(text()), text(' '), text('y:'), watch(1, 0)(text())),
  element('h2', watch(2, 2)(text())),
  element('ul', text('\n  '),
    each(4, watch(3, 2), 'row, index', fragment(text('\n    '),
      element('li', watch(0, 1)(text()), text(' '), watch(1, 0)(text()), text(' '), text('- '), watch(2, 0)(text()), text('\n      '),
        element('button', text(' '), on('click', 3), text('DEL')), text('\n\n      '),
        element('h6', text('test')), text('\n      '),
        element('ul', text('\n        '),
          each(5, watch(4, 0), 'row2, index2', fragment(text('\n          '),
            element('div', watch(0, 0)(text()), text(' '), watch(1, 0)(text()), text(' '), watch(2, 1)(text()), text(' '), watch(3, 0)(text()), text(' '), watch(4, 0)(text())), text('\n        '))), text('\n      ')), text('\n    ')), text('\n  '))), text('\n')),
  element('button', text(' '), on('click', 5), text('PUSH')))(document.body)