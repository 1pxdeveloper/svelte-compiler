const createContext = (createInstance, $$props) => {
  let dirty

  const invalidate = (value, flag) => (dirty |= (dirty || requestAnimationFrame(updates), flag), value)

  const [ctx, set] = createInstance(invalidate, $$props)
  ctx.bindings = []
  ctx.set = (prop, value) => {
    if (!prop in set) return
    $$props[prop] = ctx[set[prop]](value)
  }

  /// @TODO: 너무 꺼내고 하는게 많은데? 잘 정리 좀 해보자.
  const updates = () => {
    for (const binding of ctx.bindings) update(binding, dirty)
    dirty = 0
  }

  const update = (binding, dirty) => {
    let [value, updateCallback, dataCallback, ...keys] = binding
    for (const key of keys) {
      if (key & dirty) return (value !== (binding[0] = value = dataCallback()) && updateCallback(value))
    }
  }

  return ctx
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const watch = (index) => (callback) => (el, ctx) => {
  let [updateCallback, destroyCallback] = callback(el, ctx)
  let [dataCallback, mask] = ctx[index]
  let value = dataCallback()
  updateCallback(value)

  let binding = [value, updateCallback, dataCallback, mask]
  ctx.bindings = ctx.bindings || []
  ctx.bindings.push(binding)

  return () => {
    binding.length = 0
    ctx.bindings = ctx.bindings.filter(b => b.length)
    destroyCallback()
  }
}


/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const setter = (index) => (callback) => (el, ctx) => {

  console.log("setter", ctx, index)

  const set = (value) => {
    ctx[index](value)
  }

  return callback(set)(el, ctx)
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const noop = () => {}

const createComponent = (createInstance, ...nodes) => (el, props = Object.create(null)) => {
  const ctx = createContext(createInstance, props)
  return [
    fragment(...nodes)(el, ctx),
    ctx
  ]
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

const attr = (nodeName, nodeValue) => (el) => {
  el.setAttribute(nodeName, nodeValue)
  return noop
}

const $attr = (nodeName) => (el) => [
  (nodeValue) => el.setAttribute(nodeName, nodeValue),
  () => el = null
]

const text = (data) => (el) => {
  let textNode = document.createTextNode(data)
  el.appendChild(textNode)
  return () => textNode = void textNode.remove()
}

const $text = (el) => {
  let textNode = document.createTextNode('')
  el.appendChild(textNode)
  return [
    (data) => textNode.textContent = data,
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

  /// @FIXME: 중복 패턴
  let frag = document.createDocumentFragment()
  let placeholder = document.createTextNode('')
  el.appendChild(placeholder)

  return conditions[0]((el, ctx) => [
    () => {
      destroyCallbacks()
      const f = fragments[conds.indexOf(true)]
      destroyCallbacks = f ? f(el, ctx) : noop
      placeholder.before(frag)
    },
    () => {
      fragments = conds = destroyCallbacks = void destroyCallbacks()
      frag = placeholder = placeholder.remove()
    }
  ])(frag, ctx)
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
  const fetchSource = (source) => fetch(source).then(res => res.text()).then(res => {
    const code = parser.transformSvelte(res)
    return new Function(code)
  })

  return Promise.all(sources.map(fetchSource)).then(args => {
    return fn(...args)
  })
}


const component = (comp, ...nodes) => (el, ctx) => {

  console.log("component!!")

  let destroyCallback


  /// @FIXME: 중복 패턴
  let frag = document.createDocumentFragment()
  let placeholder = document.createTextNode('')
  el.appendChild(placeholder)

  let props = Object.create(null)

  /// 몽키패칭
  frag.setAttribute = (name, value) => {
    props[name] = value
    console.log("1111 frag.setAttribute", name, value, props)
  }


  let destroyCallback2 = nodes.map(node => node(frag, ctx))


  comp(frag, props).then(res => {

    console.log("@@@@@@@@@@@@@@@@", res)

    let [_destroyCallback, _ctx] = res

    frag.setAttribute = (name, value) => {
      _ctx.set(name, value)
      console.log("2222 frag.setAttribute", name, value, props, _ctx)
    }


    destroyCallback = _destroyCallback
    placeholder.before(frag)
  })


  return () => {
    destroyCallback = void destroyCallback()
    destroyCallback2 = void destroyCallback2.forEach(destroyCallback => destroyCallback())
  }
}