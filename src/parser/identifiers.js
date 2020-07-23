let index
let indentifiers

export const initIndentifiers = () => {
  index = 0
  indentifiers = Object.create(null)
}

export const getIndentifiers = () => indentifiers
export const getIndentifier = (key) => indentifiers[key]
export const setIndentifiers = (key) => indentifiers[key] = indentifiers[key] || (1 << index++)

initIndentifiers()