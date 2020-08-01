let index = 0
let reactive
let reactiveTable
let scopeIds = []

export const initReactive = () => (reactiveTable = Object.create(null), reactive = [])
export const setReactive = (code) => index = reactiveTable[code] = code in reactiveTable ? reactiveTable[code] : reactive.push(code) - 1

export const enterScope = (code) => {
  index++
  let _old = reactive
  scopeIds.unshift([index, reactive, reactiveTable])

  console.log("enterScope", scopeIds.slice())

  initReactive()
  _old[index] = [`(${code})`, reactive]
  return index
}

export const exitScope = () => {
  console.log("exitScope", scopeIds.slice())

  const [_index, _reactive, _reactiveTable] = scopeIds.shift()

  index = _index
  reactive = _reactive
  reactiveTable = _reactiveTable

  return index
}

initReactive()