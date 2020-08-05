module("./Inner.svelte")(Inner => {
  function createInstance(invalidate) {

    let a = 1
    let b = 2
    return [
      () => a,
      value => a = value,
      () => b,
      value => b = value,
      () => a + b]
  }

  return render(createInstance,
    component(Inner, text('sdklfjklsf')),
    element('label', text('\n  '),
      element('input', text(' '), attr('type', 'number'), text(' '), watch(0, 1)(setter(1, 3)($bind('value'))), text(' '), attr('min', '0'), text(' '), attr('max', '10')), text('\n  '),
      element('input', text(' '), attr('type', 'range'), text(' '), watch(0, 1)(setter(1, 3)($bind('value'))), text(' '), attr('min', '0'), text(' '), attr('max', '10')), text('\n')),
    element('label', text('\n  '),
      element('input', text(' '), attr('type', 'number'), text(' '), watch(2, 4)(setter(3, 6)($bind('value'))), text(' '), attr('min', '0'), text(' '), attr('max', '10')), text('\n  '),
      element('input', text(' '), attr('type', 'range'), text(' '), watch(2, 4)(setter(3, 6)($bind('value'))), text(' '), attr('min', '0'), text(' '), attr('max', '10')), text('\n')),
    element('p', watch(0, 1)($text), text(' '), text('+ '), watch(2, 4)($text), text(' '), text('= '), watch(4, 5)($text)))(arguments[0])
})