let dirty
let props = Object.create(null)
let bindings = []

const invalidate = (key, value) => {
  dirty = dirty || requestAnimationFrame(updates) && Object.create(null)
  dirty[key] = true
  props[key] = value
}

const updates = () => {
  for (const binding of bindings) update(binding, props, dirty)
  dirty = undefined
}

const update = (binding, props, dirty) => {
  const [callback, ...keys] = binding
  const args = []
  for (const key of keys) {
    if (!dirty[key]) return
    args.push(props[key])
  }
  callback(...args)
}
