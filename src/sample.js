module("./Inner.svelte")(Inner => {
  function createInstance(invalidate) {

    let a = 1
    let b = 2
    let y = 100
    let z

    const onclick = () => {
      console.log(Inner)
      invalidate(2, y++)
    }
    return [
      () => z,
      () => y,
      () => a,
      value => a = value,
      () => b,
      value => b = value,
      () => a + b,
      () => onclick]
  }

  return createComponent(createInstance,
    element('div', text('z:??'), watch(0, 1)($text)),
    component(Inner, watch(1, 2)($attr('y')), text('sdklfjklsf')),
    element('label', text('\n  '),
      element('input', attr('type', 'number'), watch(2, 4)(setter(3, 12)($bind('value'))), attr('min', '0'), attr('max', '10')), text('\n  '),
      element('input', attr('type', 'range'), watch(2, 4)(setter(3, 12)($bind('value'))), attr('min', '0'), attr('max', '10')), text('\n')),
    element('label', text('\n  '),
      element('input', attr('type', 'number'), watch(4, 16)(setter(5, 24)($bind('value'))), attr('min', '0'), attr('max', '10')), text('\n  '),
      element('input', attr('type', 'range'), watch(4, 16)(setter(5, 24)($bind('value'))), attr('min', '0'), attr('max', '10')), text('\n')),
    element('p', watch(2, 4)($text), text(' '), text('+ '), watch(4, 16)($text), text(' '), text('= '), watch(6, 20)($text)),
    element('button', on('click', 7), text('skladjf')))(arguments[0])
})