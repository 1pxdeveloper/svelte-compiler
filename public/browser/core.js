let dirty
let bindings = []

const invalidate = (value, flag) => {
  dirty |= (dirty || requestAnimationFrame(updates) && flag)

  console.log('invalidate', value, flag)
  console.log('bindings', bindings)

  return value
}

/// @TODO: 너무 꺼내고 하는게 많은데? 잘 정리 좀 해보자.
const updates = () => {
  console.log('updates dirty', dirty)
  for (const binding of bindings) update(binding, dirty)
  dirty = 0
}

const update = (binding, dirty) => {
  let [value, updateCallback, dataCallback, ...keys] = binding
  for (const key of keys) {
    if (key & dirty) return (value !== (binding[0] = value = dataCallback()) && updateCallback(value))
  }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const noop = () => {}

const render = (createInstance, ...nodes) => (target) => {
  const ctx = createInstance(invalidate)
  for (const node of nodes) node(target, ctx)
}

const element = (tagName, ...nodes) => (target, ctx) => {
  const el = document.createElement(tagName)
  for (const node of nodes) node(el, ctx)
  target.appendChild(el)
  return () => [
    () => {},
    () => {}
  ]
}

const attr = (nodeName, nodeValue = '') => (el) => {
  el.setAttribute(nodeName, nodeValue)
  return [
    (nodeValue) => el.setAttribute(nodeName, nodeValue),
    () => {}
  ]
}

const text = (data = '') => (el) => {
  const textNode = document.createTextNode(data)
  el.appendChild(textNode)
  return [
    (data) => textNode.nodeValue = data
  ]
}

const watch = (callback, index, mask) => (el, ctx) => {
  const [updateCallback] = callback(el, ctx)
  const binding = [undefined, updateCallback, ctx[index], mask]
  bindings.push(binding)
  update(binding, mask)
}

const on = (type, index) => (el, ctx) => {
  const listener = ctx[index]()
  el.addEventListener(type, listener)
  return [
    noop,
    () => el.removeEventListener(type, listener)
  ]
}