module()(() => {
  function createInstance($$invalidate, $$props, $$update) {
    let x = 7
    return [[[() => x > 10, 1], [() => x, 1], [() => 5 > x, 1]], {}]
  }

  return createComponent(createInstance,
    If([0, fragment(
      element('p', watch(1)($text), text(' '), text('is greater than 10')))],
      [2, fragment(
        element('p', watch(1)($text), text(' '), text('is less than 5')))],
      [, fragment(
        element('p', watch(1)($text), text(' '), text('is between 5 and 10')))]))(...arguments)
})