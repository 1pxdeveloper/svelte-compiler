const noop = () => {}

const createContext = (createInstance, $$props) => {
  let dirty
  let bindings = []

  /// @TODO: 너무 꺼내고 하는게 많은데? 잘 정리 좀 해보자.
  const updates = (t, count = 0) => {
    console.log("update", count)
    if (count > 1024) return requestAnimationFrame(updates) /// 무한 사이클 방지 해야 될텐데...
    const curr = dirty
    dirty = 0
    for (const binding of bindings) update(binding, curr)
    if (dirty !== 0) updates(t, count + 1)
  }

  const update = (binding, dirty) => {
    let [value, updateCallback, dataCallback, ...keys] = binding
    for (const key of keys) {
      if (key & dirty) return (value !== (binding[0] = value = dataCallback()) && updateCallback(value))
    }
  }

  const $$invalidate = (value, flag) => (dirty |= (dirty || requestAnimationFrame(updates), flag), value)

  const $$update = (callback, mask) => {
    callback()
    bindings.push([NaN, callback, () => NaN, mask])
  }

  const [ctx, set] = createInstance($$invalidate, $$props, $$update)

  ctx.watch = function (index, updateCallback) {
    const [dataCallback, mask] = this[index]
    const value = dataCallback()
    updateCallback(value)

    let binding = [value, updateCallback, dataCallback, mask]
    bindings.push(binding)

    return () => {
      binding.length = 0
      bindings = bindings.filter(b => b.length)
      binding = null
    }
  }

  ctx.set = (prop, value) => {
    if (!prop in set) return
    $$props[prop] = ctx[set[prop]](value)
  }

  return ctx
}


const createScopeContext = (ctx, scope, args) => {

  let [newCtx, mask] = scope

  newCtx = newCtx(...args)
  console.log("newCtx, mask", newCtx, mask)

  newCtx.watch = ctx.watch
  newCtx.set = ctx.set

  newCtx.update = function () {
    // @TODO
  }

  return newCtx
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const watch = (index) => (callback) => (el, ctx) => {
  let [updateCallback, destroyCallback] = callback(el, ctx)
  let unwatch = ctx.watch(index, updateCallback)
  return () => unwatch = void unwatch() & destroyCallback()
}


/// @TODO: 변수가 32개 넘어가면 mask 복수개가 필요함.
const setter = (index) => (callback) => (el, ctx) => callback(ctx[index])(el, ctx)


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
  return () => destroyCallback = el = void destroyCallback() || void el.remove()
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
  let template = document.createElement('template')
  let frag = []
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
  (value) => {
    el.removeEventListener(type, listener)
    el.addEventListener(type, (listener = value))
  },
  () => listener = void el.removeEventListener(type, listener)
]


const toNumber = (a, n = +a) => a && n === n ? n : a


/// @TODO: plugin 식으로 만들어야 확장하기 편할듯
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


const each = (scopeId, watcher, node) => {
  const FRAGMENT = 0
  const CONTEXT = 1
  const DESTORY = 2

  return watcher((el, ctx) => {
    console.group("each/$callback")
    console.log("@@@@@@@@@@@@@@@@@@@", el, ctx)
    console.groupEnd()

    let prev = []
    let eachFragments = []

    let placeholder = document.createTextNode('')
    el.appendChild(placeholder)

    return [
      (curr) => {
        const difference = diff(prev, curr)
        prev = curr

        let prevFragments = eachFragments
        eachFragments = []

        for (const [type, value, prev_index, index] of difference) {
          console.log(type, value, prev_index, index)

          switch (type) {
            case diff.DELETE:
              prevFragments[prev_index][DESTORY]()
              break

            case diff.NOT_CHANGED:
              eachFragments[index] = prevFragments[prev_index]
              const eachContext = prevFragments[prev_index][CONTEXT]
              console.log("@TODO: data update Here!!!!!!!!!!", eachContext)
              break
          }
        }

        for (const [type, value, prev_index, index] of difference) {
          switch (type) {

            /// @TODO: diff.PATCH: insert이나 DELETE에 속한 data일 때,
            case diff.PATCH:
              break

            case diff.INSERT:
              let eachFragment = document.createDocumentFragment()
              let eachContext = createScopeContext(ctx, ctx[scopeId], [value, index, curr])
              let eachDestroyCallback = node(eachFragment, eachContext)
              eachFragments[index] = [Array.from(eachFragment.childNodes), eachContext, eachDestroyCallback]

              let insertPlaceholder = eachFragments[index + 1] && eachFragments[index + 1][FRAGMENT][0] || placeholder
              insertPlaceholder.before(eachFragment)
              break
          }
        }

        eachFragments = eachFragments.filter(v => v)

        console.group("each/update")
        console.log("??????????????????????????????????", curr)
        console.log("eachFragments", eachFragments)
        console.groupEnd()
      },

      () => prev = el = ctx = null
    ]
  })
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