let dirty
let bindings = []

const invalidate = (flag, value) => (dirty |= (dirty || requestAnimationFrame(updates), flag), value)

/// @TODO: 너무 꺼내고 하는게 많은데? 잘 정리 좀 해보자.
const updates = () => {
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
  let el = document.createElement(tagName)
  let destroyCallbacks = nodes.map(node => node(el, ctx)[1])
  target.appendChild(el)

  return [
    noop,
    () => {
      destroyCallbacks = void destroyCallbacks.forEach(callback => callback())
      el = void el.remove()
    }
  ]
}

const attr = (nodeName, nodeValue = '') => (el) => {
  el.setAttribute(nodeName, nodeValue)
  return [
    (nodeValue) => el.setAttribute(nodeName, nodeValue),
    () => el = null
  ]
}

const text = (data = '') => (el) => {
  let textNode = document.createTextNode(data)
  el.appendChild(textNode)
  return [
    (data) => textNode.nodeValue = data,
    () => textNode = void textNode.remove()
  ]
}

const watch = (index, mask) => (callback) => (el, ctx) => {
  let [updateCallback, destroyCallback] = callback(el, ctx)
  let binding = [undefined, updateCallback, ctx[index], mask]
  bindings.push(binding)
  update(binding, mask)

  return [
    updateCallback,

    () => {
      binding.length = 0
      bindings = bindings.filter(b => binding !== b)
      destroyCallback()
    }
  ]
}


const on = (type, index) => (el, ctx) => {
  let listener = ctx[index]()
  el.addEventListener(type, listener)
  return [
    noop,
    () => {
      el.removeEventListener(type, listener)
      listener = null
    }
  ]
}

const classList = (className) => (el) => [
  (flag) => el.classList.toggle(className, flag),
  () => el = null
]

const $if = (...nodes) => (...elseNodes) => (el, ctx) => {
  let destroyCallbacks = []

  return [
    (flag) => {
      destroyCallbacks.forEach(callback => callback())
      destroyCallbacks = (flag ? nodes : elseNodes).map(node => node(el, ctx)[1])
    },

    () => destroyCallbacks = null
  ]
}