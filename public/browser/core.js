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

  return () => {
    binding.length = 0
    bindings = bindings.filter(b => b.length)
    destroyCallback()
  }
}


/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const setter = (index, mask) => (callback) => (el, ctx) => {
  const set = (value) => {
    ctx[index](value)
    invalidate(mask)
  }

  return callback(set)(el, ctx)
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const noop = () => {}

const render = (createInstance, ...nodes) => (target) => {
  const ctx = createInstance(invalidate)
  for (const node of nodes) node(target, ctx)
}

const fragment = (...nodes) => (el, ctx) => {
  let destroyCallbacks = nodes.map(node => node(el, ctx))
  return () => destroyCallbacks = void (destroyCallbacks && destroyCallbacks.forEach(callback => callback()))
}

const element = (tagName, ...nodes) => (target, ctx) => {
  let el = document.createElement(tagName)
  let destroyCallback = fragment(...nodes)(el, ctx)
  target.appendChild(el)

  return () => {
    destroyCallback = void destroyCallback()
    el = void el.remove()
  }
}

const attr = (nodeName, nodeValue = '') => (el) => {
  el.setAttribute(nodeName, nodeValue)
  return noop
}

const $attr = (nodeName) => (el) => [
  (nodeValue) => el.setAttribute(nodeName, nodeValue),
  () => el = null
]

const text = (data = '') => (el) => {
  let textNode = document.createTextNode(data)
  el.appendChild(textNode)
  return () => textNode = void textNode.remove()
}

const $text = (el) => {
  let textNode = document.createTextNode('')
  el.appendChild(textNode)
  return [
    (data) => textNode.nodeValue = data,
    () => textNode = void textNode.remove()
  ]
}

const on = (type, index) => (el, ctx) => {
  let listener = ctx[index]()
  el.addEventListener(type, listener)
  return () => listener = void el.removeEventListener(type, listener)
}

const $class = (className) => (el) => [
  (flag) => el.classList.toggle(className, flag),
  () => el = null
]

const If = (...conditions) => (el, ctx) => {
  let fragments = conditions.filter((a, index) => index % 2)
  let watchers = conditions.filter((w, index) => index % 2 === 0 && w)

  console.log("watchers", watchers)

  let conds = [...new Array(watchers.length), true]
  let cond = (index) => () => [value => conds[index] = value]
  watchers.forEach((watcher, index) => watcher(cond(index))(el, ctx))

  let destroyCallbacks = noop

  return conditions[0]((el, ctx) => [
    () => {
      destroyCallbacks()
      const f = fragments[conds.indexOf(true)]
      destroyCallbacks = f ? f(el, ctx) : noop
    },
    () => fragments = conds = destroyCallbacks = void destroyCallbacks()
  ])(el, ctx)
}

const each = (scopeId, watcher, frag) => (el, ctx) => {

  let $callback = (el, ctx) => {
    console.group("each/$callback")
    console.log("@@@@@@@@@@@@@@@@@@@", el, ctx)
    console.groupEnd()

    let destroyCallbacks = []

    return [
      (data) => {
        for (const destroyCallback of destroyCallbacks) destroyCallback()

        for (let i = 0; i < data.length; i++) {
          destroyCallbacks.push(frag(el, ctx[scopeId](data[i], i)))
        }

        console.group("each/update")
        console.log("??????????????????????????????????", data)
        console.groupEnd()
      },
      noop,
    ]
  }

  return watcher($callback)(el, ctx)
}


const toNumber = (a, n = +a) => n === n ? n : a

const $bind = (prop) => (set) => (el) => {

  if (prop === "value") {
    const handler = () => set(toNumber(el.value))
    el.addEventListener("input", handler)

    return [
      (value) => el.value = value,
      () => el = void el.removeEventListener("input", handler)
    ]
  }

  return [
    (value) => el[prop] = value,
    () => el = null
  ]
}




const module = (...sources) => (fn) => {
  if (sources.length === 0) return fn()


  const source = sources[0]

  fetch(source).then(res => res.text()).then(res => {

    const code = parser.transformSvelte(res)
    const f = new Function('return ' + code)

    console.log(f)
  })



  return fn()
}


const component = (comp, ...nodes) => (target, ctx) => {
  let el = document.createElement('Component')
  let destroyCallback = fragment(...nodes)(el, ctx)
  target.appendChild(el)

  return () => {
    destroyCallback = void destroyCallback()
    el = void el.remove()
  }
}


