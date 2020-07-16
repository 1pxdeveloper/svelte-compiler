import {Observable} from "../observable";

Observable.prototype.todo = function (message) {
  return this.tap(value => console.log("\x1b[43m" + "@TODO: " + message, value))
}

export * from "./action.js"
export * from "./writable.js"