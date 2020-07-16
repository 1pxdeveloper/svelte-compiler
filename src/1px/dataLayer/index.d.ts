import {NextCallback, Observer, Subscription} from "../observable";

interface Writable {
  set(value: any): any
  update(callback: Function): any
}

interface Observable {
  createEffect(observer?: Observer | NextCallback, error?: Function, complete?: Function): Subscription;
  dispatch(callback: Function): Subscription;
  dispatch(type: string, callback: Function): Subscription;
  writeTo(writable: Writable, callback?: Function | any): Observable
}

interface Action extends Function {
  (...payload: any[]): [string, ...any[]]
  type: string

  REQUEST: Action
  SUCCESS: Action
  FAILURE: Action

  START: Action
  NEXT: Action
  ERROR: Action
  COMPLETE: Action
}

declare function createAction(type: string, constructor?: Function): Action;
declare function createWritable(initValue?: any, path?: string): Observable

declare function dispatch(action: []): Observable
declare function dispatch(type: string | any, payload?: any): Observable
declare function on(...actions: Action[] | String[]): Observable