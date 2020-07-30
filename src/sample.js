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
  return [() => x, () => y, () => name, () => test, () => !!(x % 3), () => x > 0, () => x + y, () => reset]
}

render(createInstance, text('\n\n\n'),
  element('h1', text('x:'), watch(0, 1)(text()), text(' y:'), watch(1, 2)(text()), text(' name: '), watch(2, 4)(text())), text('\n'),
  element('h2', watch(3, 8)(classList('test')), text('class test')), text('\n\n'), watch(4, 1)($if(0, text('\n  text\n  '),
    element('p', text('x:'), watch(0, 1)(text()), text(' x는 짝수입니다.')), text('\n  '),
    element('p', text('y:'), watch(1, 2)(text()), text(' x는 짝수입니다.')), text('\n  '),
    element('p', text('x:'), watch(0, 1)(text()), text(' x는 짝수입니다.')), text('\n'))), watch(4, 1)($if(1, text('\n  '),
    element('h1', text('This Else!!')), text('\n'))), text('\n\n'),
  element('div', watch(0, 1)(attr('x')), attr('y', '`${y}`'), watch(5, 1)(classList('red')), text('\n  '),
    element('a', attr('href', '`http://1px.kr/${name+1}/${x+y}`'), text('hello, '), watch(2, 4)(text()), text(' '), watch(6, 3)(text()), text('!')), text('\n')), text('\n\n'),
  element('button', on('click', 7), text('reset')))(document.body)