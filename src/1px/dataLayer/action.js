import {Observable, Subject} from "../observable";
import {onDestroy} from "svelte";

const itself = (value) => value;

Observable.prototype.createEffect = function (...args) {
  const s = this.catchError(error => console.log(error)).subscribe(...args);
  try {
    onDestroy(() => s.unsubscribe())
  } catch (e) {
  }
  return s;
};

const _createAction = (type, constructor = itself) => {
  const f = (...payload) => [type, constructor(...payload)];
  f.toString = () => type;
  return f;
}

export const createAction = (type, constructor = itself) => {
  type = type.toString();
  const f = _createAction(type, constructor);

  f.REQUEST = _createAction(type + ".REQUEST");
  f.SUCCESS = _createAction(type + ".SUCCESS");
  f.FAILURE = _createAction(type + ".FAILURE");

  f.START = _createAction(type + ".START");
  f.NEXT = _createAction(type + ".NEXT");
  f.ERROR = _createAction(type + ".ERROR");
  f.COMPLETE = _createAction(type + ".COMPLETE");

  f.CANCEL = _createAction(type + ".CANCEL");
  return f;
}

export const actions$ = new Subject();

/// @TODO: Logger => 추후 미들웨어로 분리할 것! [2020. 5. 28]
actions$
  .tap((action, index) => {
    const [type, payload] = action;

    switch (type) {
      case "mousemove":
        return;
    }

    console.group("#" + index + " " + type);
    payload !== undefined && console.log(payload);
    console.log("");
    setTimeout(() => console.groupEnd(), 0);
  })
  .createEffect();


const makeAction = (type, payload) => {
  if (Array.isArray(type)) {
    [type, payload] = type;
  }

  return [type.toString(), payload];
}

const _dispatch = (type, payload) => actions$.next([type, payload]);


// @TODO: 라이브러리로 이동할것!
const _splitByIndex = (index) => (string, i = index < 0 ? string.length : index) => [string.slice(0, i), string.slice(i)];

const _splitByCallback = (callback) => (string) => _splitByIndex(callback(string))(string);

const _splitByExt = _splitByCallback(str => str.lastIndexOf("."))


export const dispatch = (type, payload, startValue) => {
  if (!type) {
    throw new TypeError("'action' must be required. Do not use dispatch()")
  }

  [type, payload] = makeAction(type, payload);

  /// @TODO: Epic => 추후 미들웨어로 분리할 것! [2020. 5. 28]
  const [_type, _extend] = _splitByExt(type);

  if (!_extend) {
    _dispatch(type, payload);
    return payload;
  }

  if (_extend === ".START") {
    const s = new Subject();
    const o$ = Observable.castAsync(payload).bind(
      () => _dispatch(type, startValue),
      value => _dispatch(_type + ".NEXT", value),
      error => _dispatch(_type + ".ERROR", error),
      () => _dispatch(_type + ".COMPLETE")
    )
    o$.createEffect(s);
    return s;
  }

  if (_extend === ".REQUEST") {
    const s = new Subject();
    let _value;
    const o$ = Observable.castAsync(payload).bind(
      () => _dispatch(type, startValue),
      value => {
        _value = value;
        _dispatch(_type + ".NEXT", value);
      },
      error => _dispatch(_type + ".FAILURE", error),
      () => _dispatch(_type + ".SUCCESS", _value)
    )
    o$.createEffect(s);
    return s;
  }

  _dispatch(type, payload);
  return payload;
}


Observable.prototype.dispatch = function (type, payload) {
  if (!type) return this.createEffect();

  // case1. .dispatch(GO("내 정보"));
  if (arguments.length === 1 && Array.isArray(type)) {
    return this.mergeMap(() => dispatch(type)).createEffect();
  }

  // case2. 	.dispatch(data => GO(data.id, data.params))
  if (arguments.length === 1 && typeof type === "function") {
    return this.map(type).mergeMap(action => dispatch(action)).createEffect();
  }

  // case2-2. 	.dispatch("ACTION")
  if (arguments.length === 1 && typeof type === "string") {
    return this.mergeMap(params => dispatch(type, params)).createEffect();
  }

  // case3. 	.dispatch(학습진도현황_조회하기.REQUEST, account => aicms.retrieveMypageInfo(account.email))
  if (arguments.length === 2 && typeof payload === "function") {
    return this.map(payload).mergeMap(payload => dispatch(type, payload)).createEffect();
  }

  console.warn("이런 경우는 아직 안 만듬.", type, payload);
}



Observable.prototype.validate = function (callback, error) {
  return this
    .withLatestFrom(actions$)
    .mergeMap(([value, action]) => {
      if (!callback(value)) {
        return Observable.of(value);
      }
      const [type] = action;
      const [_type] = _splitByExt(type);
      dispatch(_type + ".ERROR", error);
      return Observable.never();
    })
};



/// on
const memo = {};
const _on = (type) => memo[type] = memo[type] || actions$
  .filter(action => action[0] === type.toString())
  .map(action => action[1])
  .share()

export const on = (...type) => Observable.merge(...type.map(_on))