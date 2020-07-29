function createInstance(invalidate) {
  let name = 100
  let x = 5
  let y = 7
  let test = false

  setInterval(() => {

    invalidate(4, name++)
    invalidate(1, x++)
    invalidate(2, y--)
  }, 1000)

  const reset = () => {
    invalidate(4, name = 0)
    invalidate(1, x = 0)
    invalidate(2, y = 0)
    invalidate(8, test = !test)
  }
  return [() => x, () => y, () => name, () => test, () => `${y}`, () => x > 0, () => `http://1px.kr/${name + 1}/${x + y}`, () => x + y, () => reset]
}

render(createInstance, text('\n\n\n'),
  element('h1', text('x:'), watch(text(), 0, 1), text(' y:'), watch(text(), 1, 2), text(' name: '), watch(text(), 2, 4)), text('\n'),
  element('h2', watch(classList('test'), 3, 8), text('class test')), text('\n\n'),
  element('div', watch(attr('x'), 0, 1), watch(attr('y'), 4, 2), watch(classList('red'), 5, 1), text('\n  '),
    element('a', watch(attr('href'), 6, 7), text('hello, '), watch(text(), 2, 4), text(' '), watch(text(), 7, 3), text('!')), text('\n')), text('\n\n\n'),
  element('button', on('click', 8), text('reset')))(document.body)