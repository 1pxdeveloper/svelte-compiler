module()(() => {
  function createInstance(invalidate, $$props) {
    let {
      prop = 100
    } = $$props

    let x = 0
    let arr = [1, 2, 3]

    setInterval(() => {

      invalidate(x++, 1)
    }, 1000)
    return [
      [
        [() => x, 0],

        [() => arr, 0],

        (row, index) => [

          [() => row, 0],
          [() => index, 0],
          [() => row + x, 0]
        ]],

      {}
    ]
  }

  return createComponent(createInstance,
    element('h1', watch(0, 1)($attr('id')), text('Hello, '), watch(0, 1)($text), text(' '), watch(0, 1)($text)),
    element('ul', text('\n  '),
      each(2, watch(1, 0), fragment(text('\n    '),
        element('li', watch(0, 0)($text), text(' '), watch(1, 0)($text), text(' '), watch(2, 1)($text)), text('\n  '))), text('\n')))(arguments[0])
})