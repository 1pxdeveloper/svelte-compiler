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


/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const watch = (index, mask) => (callback) => (el, ctx) => {
  let [updateCallback, destroyCallback] = callback(el, ctx)
  let dataCallback = ctx[index]
  let value = dataCallback()
  updateCallback(value)

  let binding = [value, updateCallback, dataCallback, mask]
  bindings.push(binding)

  return [
    noop,
    () => {
      binding.length = 0
      bindings = bindings.filter(b => b.length)
      destroyCallback()
    }
  ]
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const noop = () => {}

const render = (createInstance, ...nodes) => (target) => {
  const ctx = createInstance(invalidate)
  for (const node of nodes) node(target, ctx)
}

const fragment = (...nodes) => (el, ctx) => {
  let destroyCallbacks = nodes.map(node => node(el, ctx)[1])
  return [
    noop,
    () => destroyCallbacks = void (destroyCallbacks && destroyCallbacks.forEach(callback => callback()))
  ]
}

const element = (tagName, ...nodes) => (target, ctx) => {
  let el = document.createElement(tagName)
  let destroyCallback = fragment(...nodes)(el, ctx)[1]
  target.appendChild(el)

  return [
    noop,
    () => {
      destroyCallback = void destroyCallback()
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


const on = (type, index) => (el, ctx) => {
  let listener = ctx[index]()
  el.addEventListener(type, listener)
  return [
    noop,
    () => listener = void el.removeEventListener(type, listener)
  ]
}

const classList = (className) => (el) => [
  (flag) => el.classList.toggle(className, flag),
  () => el = null
]

const If = (...conditions) => (el, ctx) => {
  let fragments = conditions.filter((a, index) => index % 2)
  let watchers = conditions.filter((w, index) => index % 2 === 0 && w)

  console.log("watchers", watchers)

  let conds = [...new Array(watchers.length), true]
  let cond = (index) => () => [value => conds[index] = value]
  let watcher = conditions[0]
  let destory2 = noop
  watchers.forEach((watcher, index) => watcher(cond(index))(el, ctx))

  watcher(() => [
    () => {
      console.log(conds)

      destory2()
      const f = fragments[conds.indexOf(true)]
      destory2 = f(el, ctx)[1]
    },
    noop,
  ])(el, ctx)

  return [
    noop,
    () => el = ctx = fragments = destory2 = conds = void destory2()
  ]
}

const each = (scopeId, watcher, code, frag) => (el, ctx) => {

  let callback = (el, ctx) => {
    console.group("each/callback")
    console.log("@@@@@@@@@@@@@@@@@@@", el, ctx)
    console.groupEnd()

    let destroyCallbacks = []

    return [
      (data) => {
        for (const destroyCallback of destroyCallbacks) destroyCallback()

        for (let i = 0; i < data.length; i++) {
          destroyCallbacks.push(frag(el, ctx[scopeId](data[i], i))[1])
        }

        console.group("each/update")
        console.log("??????????????????????????????????", data)
        console.groupEnd()
      },
      noop,
    ]
  }

  return watcher(callback)(el, ctx)
}

window.i = "#I#"
