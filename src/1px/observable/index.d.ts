interface Observer {
  next(value: any): void
  error(error: any): void
  complete(): void
}

interface SubscriptionObserver extends Observer {
  readonly closed: Boolean
}

type Subscriber = (subscriber: SubscriptionObserver) => Subscription | (() => void) | void
type NextCallback = (value: any) => void

interface Subscription {
  readonly closed: Boolean
  unsubscribe(): void
}

export interface Observable {
  subscribe(observer: Observer | NextCallback, error?, complete?): Subscription

  pipe(value): (...operators) => Observable

  bind(onStart, onNext, onError, onComplete): Observable
  bufferCount(bufferSize: number, startBufferEvery?: number)
  bufferTime(duration: number)
  catchError(callback): Observable
  concat(...observables: Observable[]): Observable
  concatMap(callback): Observable
  connectMap(callback): Observable
  count(): Observable
  debounce(debounceTime: number): Observable
  debounceTime(dueTime: number): Observable
  debug(tag: string): Observable
  delay(delayTime: number): Observable
  distinctUntilChanged(compare: (a, b) => boolean): Observable
  duration(durationTime: number): Observable
  exhaustMap(callback): Observable
  filter(callback: Function, elseCallback?: Function): Observable
  finalize(callback): Observable
  initialize(callback): Observable
  last(): Observable
  map(callback): Observable
  mapTo(value): Observable
  mergeAll(): Observable
  mergeMap(callback): Observable
  reject(callback: Function, elseCallback?: Function): Observable
  retry(count: number): Observable
  repeat(count: number): Observable
  scan(accumulator, seed): Observable
  share(): Observable
  shareReplay(bufferSize: number): Observable
  skip(count: number): Observable
  skipUntil(notifier: Observable): Observable
  startWith(value): Observable
  switchMap(callback): Observable
  tap(onNext, onError?, onComplete?): Observable
  take(count: number): Observable
  takeLast(num: number): Observable
  takeUntil(notifier: Observable): Observable
  takeWhile(callback): Observable
  timeout(duration: number): Observable
  throttle(callback): Observable
  throttleTime(time: number): Observable
  trace(tag: string): Observable
  withLatestFrom(...observables): Observable
  until(notifier): Observable
}

export declare const Observable: {
  new(subscriber: Subscriber): Observable;
  from(observable: Observable): Observable;
  of(...args: any[]): Observable

  NEVER: Observable
  EMPTY: Observable
  never(): Observable
  empty(): Observable

  timer(duration: number): Observable
  defer(callback, thisObj?, ...args): Observable
  timer(initialDelay: number, period?: number): Observable
  fromEvent(el: HTMLElement, type: string, useCapture: Boolean): Observable
  throwError(error): Observable
  fromPromise(promise: Promise<any>): Observable
  castAsync(value): Observable
  forkjoin(...observables): Observable
  concat(...observables): Observable
  zip(...observables): Observable
  merge(...observables): Observable
  combineLatest(...observables): Observable
  combineAnyway(...observables): Observable
  reduce(...defs): Observable
}


export interface Subject extends Observable {
}

export interface BehaviorSubject extends Observable {
}

export interface AsyncSubject extends Observable {
}

export interface ReplaySubject extends Observable {
}