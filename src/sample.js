function createInstance(invalidate) {
  let name = 100
  let x = 5
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
  return [() => x, () => !!(x % 2), () = a > !!(x > 5)]
}

render(createInstance,
  element('div', text('x: '), watch(0, 1)(text())), watch(1, 1)($if(
    element('h1', text('sdklfjasklfdjasdf')))(watch(2, 1)($if(
    element('h2', text('else if!!')))(
     element('h2', text('else!!')))))))(document.body)