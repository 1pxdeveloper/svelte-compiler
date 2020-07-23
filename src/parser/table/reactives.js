let reactive
let reactiveTable

export const initReactive = () => (reactiveTable = Object.create(null), reactive = [])
export const setReactive = (code) => reactiveTable[code] = code in reactiveTable ? reactiveTable[code] : reactive.push(code) - 1

initReactive()