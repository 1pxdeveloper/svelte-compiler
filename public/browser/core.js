const noop = () => {}

const toNumber = (a, n = +a) => a && n === n ? n : a

const run = (fn, ...args) => fn && fn(...args)

const multiple_calls = (arr, ...args) => arr && arr.map(fn => fn && fn(...args))

const createContext = (bindings, find) => (...indexes) => (callback) => {

  const callbacks = callback(...indexes.map(index => () => find(index)))
  if (!callbacks) return noop

  /// watch
  const [updateCallback = noop, destroyCallback = noop] = callbacks || []
  updateCallback(-1)
  bindings.push(updateCallback)

  /// unwatch
  return () => {
    destroyCallback()
    let index = bindings.indexOf(updateCallback)
    index >= 0 && bindings.splice(index, 1)
  }
}

const createComponentContext = (createInstance, $$props) => {
  let dirty
  let bindings = []

  /// @TODO: 너무 꺼내고 하는게 많은데? 잘 정리 좀 해보자.
  const updates = (t, count = 0) => {
    console.log("update", count)
    if (count > 1024) return requestAnimationFrame(updates) /// 무한 사이클 방지 해야 될텐데...
    const curr = dirty
    dirty = 0
    multiple_calls(bindings, curr)
    if (dirty !== 0) updates(t, count + 1)
  }

  const $$invalidate = (value, flag) => (dirty |= (dirty || requestAnimationFrame(updates), flag), value)

  const $$update = (callback, mask) => bindings.push((dirty) => (dirty & mask) && callback())

  const [ctx, set] = createInstance($$invalidate, $$props, $$update)

  return createContext(bindings, prop => ctx[prop] || set[prop])
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const watch = (index) => (callback) => (el, ctx) => ctx(index)(dataFn => {
  let [dataCallback, mask] = dataFn()
  let value = dataCallback()
  let [updateCallback = noop, destroyCallback = noop] = callback(el, ctx) || []
  updateCallback(value)

  return [
    (dirty) => (dirty & mask) && (value !== (value = dataCallback()) || Object(value) === value) && updateCallback(value),
    () => value = dataCallback = updateCallback = destroyCallback = void destroyCallback()
  ]
})


/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const setter = (index) => (callback) => (el, ctx, set) => {
  ctx(index)(_set => void (set = callback(_set())(el, ctx)))
  return set
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const createComponent = (createInstance, ...nodes) => (el, props = Object.create(null)) => {
  const ctx = createComponentContext(createInstance, props)
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
  return () => destroyCallback = el = void destroyCallback() & el.remove()
}

const attr = (nodeName, nodeValue) => (el) => (el.setAttribute(nodeName, nodeValue), noop)

const text = (data) => (el) => {
  let textNode = document.createTextNode(data)
  el.appendChild(textNode)
  return () => textNode = void textNode.remove()
}

/// with watch
const $text = (el) => {
  let textNode = document.createTextNode('')
  el.appendChild(textNode)
  return [
    (data) => textNode.textContent = data,
    () => textNode = void textNode.remove()
  ]
}

const $html = (el) => {
  let frag = []
  let template = document.createElement('template')
  let textNode = document.createTextNode('')
  el.appendChild(textNode)

  return [
    (html) => {
      for (const node of frag) node.remove()
      template.innerHTML = html
      frag = Array.from(template.content.childNodes)
      textNode.before(template.content)
    },

    () => {
      for (const node of frag) node.remove()
      template = frag = textNode = void textNode.remove()
    }
  ]
}

const $attr = (nodeName) => (el) => [
  (nodeValue) => el.setAttribute(nodeName, nodeValue),
  () => el = null
]

const $class = (className) => (el) => [
  (flag) => el.classList.toggle(className, flag),
  () => el = null
]

const $on = (type) => (el, ctx, listener) => [
  (value) => el.addEventListener(type, (listener = value)),
  () => listener = void el.removeEventListener(type, listener)
]


/// @TODO: plugin 식으로 만들어야 확장하기 편할듯
const $bind = (prop) => (set) => (el) => {

  console.log("bind", prop, set, el)

  if (prop === "value") {

    const handler = () => set(toNumber(el.value))
    el.addEventListener("input", handler)

    return [
      (value) => el.value = value,
      () => el = void el.removeEventListener("input", handler)
    ]
  }

  if (prop === "checked") {
    const handler = () => set(el.checked)
    el.addEventListener("input", handler)

    return [
      (value) => el.checked = !!value,
      () => el = void el.removeEventListener("input", handler)
    ]
  }

  return [
    (value) => el[prop] = value,
    () => el = null
  ]
}

const use = (action, parameters) => action((el, ctx) => {
  let destroyCallback
  return [
    (fn) => {
      run(destroyCallback)

      // init
      let updateAndDestroy

      parameters(el => [data => {
        let {update = noop, destroy = noop} = fn(el, data) || {}
        updateAndDestroy = [update, destroy]
      }])(el, ctx)()

      // update & destroy
      destroyCallback = parameters(() => updateAndDestroy)(el, ctx)
    },
    () => run(destroyCallback)
  ]
})


const If = (...conditions) => (el, ctx) => ctx(...conditions.map(c => c[0]))((...conditionCallbacks) => {
  let cache
  let caches = []
  let destroyCallback

  /// @FIXME: 중복 패턴
  let frag = document.createDocumentFragment()
  let placeholder = document.createTextNode('')
  el.appendChild(placeholder)

  return [
    (dirty) => {
      let index = conditionCallbacks.findIndex((conditionCallback, index) => {
        const [dataCallback, mask] = conditionCallback() || []
        return dataCallback ? (dirty & mask) ? (caches[index] = !!dataCallback()) : caches[index] : true
      })

      if (cache === index) return
      cache = index

      destroyCallback = void run(destroyCallback)
      if (index === -1) return

      destroyCallback = conditions[index][1](frag, ctx)
      placeholder.before(frag)
    },
    () => frag = placeholder = void destroyCallback() & placeholder.remove()
  ]
})


const BINDING = 0
const FRAGMENT = 1
const CONTEXT = 2
const DESTROY = 3

const each = (watchId, scopeId, node) => (el, ctx) => ctx(watchId, scopeId)((dataFn, scopeFn) => {

  let placeholder = document.createTextNode('')
  el.appendChild(placeholder)

  let prev = []
  let eachFragments = []

  return [
    (dirty) => {
      let [dataCallback, mask] = dataFn()

      if (dirty & mask) {
        let [scopeCallback, scopeMask] = scopeFn()

        console.log("dataCallback @@@@@@@@@@@@@@@@@", dataCallback, mask)
        console.log("scopeCallback @@@@@@@@@@@@@@@@@", scopeCallback, scopeMask)

        console.log("dirty", dirty)
        dirty |= scopeMask

        console.log("dirty2", dirty)

        let collection = Array.from(dataCallback())
        let difference = diff(prev, collection)
        prev = collection

        let prevFragments = [...eachFragments]
        eachFragments = []

        for (const [type, value, prev_index, index] of difference) {
          console.log(type, value, prev_index, index)

          switch (type) {
            case diff.DELETE:
              prevFragments[prev_index][DESTROY]()
              break

            case diff.NOT_CHANGED:
              eachFragments[index] = prevFragments[prev_index]
              const eachContext = prevFragments[prev_index][CONTEXT]
              console.log("@TODO: data update Here!!!!!!!!!! 111", eachContext.args.slice())

              eachContext.args = [value, index, collection]

              console.log("@TODO: data update Here!!!!!!!!!! 222", eachContext.args)
              break
          }
        }

        for (const [type, value, prev_index, index] of difference) {
          switch (type) {
            /// @TODO: diff.PATCH: insert이나 DELETE에 속한 data일 때,
            case diff.PATCH:
              break

            case diff.INSERT:
              let bindings = []
              let eachFragment = document.createDocumentFragment()

              let eachContext = createContext(bindings, prop => {

                return scopeCallback(...eachContext.args)[prop]
              })

              eachContext.args = [value, index, collection]


              let eachDestroyCallback = node(eachFragment, eachContext)
              eachFragments[index] = [bindings, Array.from(eachFragment.childNodes), eachContext, eachDestroyCallback]


              /// @FIXME: 어떻게 DOM을 잘 끼울것인가!
              let insertPlaceholder = prevFragments[prev_index] && prevFragments[prev_index][FRAGMENT][0] || placeholder
              insertPlaceholder.before(eachFragment)
              break
          }
        }
      }

      eachFragments.forEach(e => multiple_calls(e[BINDING], dirty))
    },
    () => {}
  ]
})


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


const fade = (el, params) => {

  console.warn("fade", el, params)

  el.style.transition = "all .5s"
  requestAnimationFrame(() => {
    el.style.opacity = 1
  })



}


const transition = (action, parameters) => action((el, ctx) => {
  let destroyCallback

  return [
    (fn) => {
      run(destroyCallback)

      // init
      let updateAndDestroy

      parameters(el => [data => {


        fn(el, data)



      }])(el, ctx)
    },

    () => run(destroyCallback)
  ]
})
