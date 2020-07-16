import {_} from "../fp";
import {BehaviorSubject, Observable, Subject} from "../observable";

const itself = (value) => value;

/// @TODO: 로그용, 추후 미들웨어로 분리할 것! [2020. 5. 27]
const state = window.state = {};
const memo = {};

export function createWritable(initValue, path) {
  initValue = state.hasOwnProperty(path) ? state[path] : initValue;
  const resetValue = _.cloneObject(initValue);

  const writable = (path && memo[path]) || (initValue === undefined ? new BehaviorSubject() : new BehaviorSubject(initValue));
  writable.path = path;
  writable.set = (value) => writable.next(value);
  writable.reset = () => writable.next(resetValue);
  writable.update = (callback) => writable.next(callback(writable.value));

  /// @TODO: 로그용, 추후 미들웨어로 분리할 것! [2020. 5. 27]
  if (path && !memo[path]) {
    writable
      .distinctUntilChanged()
      .trace(path)
      .tap(value => state[path] = value)
      .subscribe();
  }

  memo[path] = writable;
  return writable;
}

Observable.prototype.writeTo = function (writable, pipe = itself) {
  const unwrap_thunk = (value) => {
    let callback = pipe;

    if (typeof callback !== "function") return callback;
    callback = callback(value);

    if (typeof callback !== "function") return callback;
    return callback(writable.value);
  }

  const subject = new Subject();

  this.createEffect((value) => {
    writable.set(unwrap_thunk(value))
    subject.next(value)
  })

  return subject;
}