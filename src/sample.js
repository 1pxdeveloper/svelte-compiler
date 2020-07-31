function createInstance(invalidate) {
  let name = 100
  let x = 0
  let y = 7
  let test = false

  setInterval(() => {

    name++
    invalidate(1, x++)
    y--
  }, 1000)

  const reset = () => {
    name = 0
    invalidate(1, x = 0)
    y = 0
    test = !test
  }
  return [() => x, () => !!(x % 2), () => !!(x > 3)]
}

render(createInstance,
  element('div', text('x: '), watch(0, 1)(text())),

  If(
    watch(1, 1), fragment(
      element('h1', text('sdklfjasklfdjasdf'))
    ),

    watch(2, 1), fragment(
      element('h2', text('else if!!'))),

    fragment(
      element('h2', text('else!!')))
  )

)(document.body)