let reactive
let reactiveTable
let scopeIds = []

export const initReactive = () => (reactiveTable = Object.create(null), reactive = [])
export const setReactive = (code, ast) => reactiveTable[code] = code in reactiveTable ? reactiveTable[code] : [reactive.push(ast) - 1, ast]

export const enterScope = (code) => {
  let _old = reactive
  scopeIds.unshift([reactive, reactiveTable])

  console.log("enterScope", scopeIds.slice())

  initReactive()
  return _old.push(['(' + code + ') => []', reactive]) - 1
}

export const exitScope = () => {
  console.log("exitScope", scopeIds.slice())

  const [_reactive, _reactiveTable] = scopeIds.shift()

  reactive = _reactive
  reactiveTable = _reactiveTable
}

initReactive()