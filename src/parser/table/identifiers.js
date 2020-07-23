let index
let identifiers

export const initIndentifiers = () => (index = 0, identifiers = Object.create(null))
export const setIndentifiers = (key, mutableTable) => mutableTable[key] ? (identifiers[key] = identifiers[key] || 1 << index++) : 0

initIndentifiers()